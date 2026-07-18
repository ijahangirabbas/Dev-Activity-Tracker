import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';
import { SessionManager } from '../sessions/sessionManager';
import { IdleDetector } from './idleDetector';
import { GitTracker } from '../git/gitTracker';
import { TerminalTracker } from '../terminal/terminalTracker';
import { WorkspaceTracker } from '../workspace/workspaceTracker';
import { FileTracker } from '../files/fileTracker';
import { AITracker } from '../ai/aiTracker';
import { LanguageTracker } from '../languages/languageTracker';
import { DashboardPanel } from '../webview/dashboardPanel';
import { ExtensionConfig, TerminalCommandEvent } from '../models/types';

export class Tracker {
  private dbService: DatabaseService;
  private sessionManager: SessionManager;
  private idleDetector: IdleDetector;
  private gitTracker: GitTracker;
  private terminalTracker: TerminalTracker;
  private workspaceTracker: WorkspaceTracker;
  private fileTracker: FileTracker;
  private aiTracker: AITracker;

  private disposables: vscode.Disposable[] = [];
  private tickInterval: NodeJS.Timeout | undefined;

  private lastCodingTime = 0;
  private lastAITime = 0;
  private lastTerminalTime = 0;
  private lastGitTime = 0;
  private lastTestingTime = 0;
  private lastTickTime = 0;

  // Multi-window session tracking
  private windowId: string;
  private ticksCount = 0;

  // Cached config — updated only on configuration change events
  private cachedConfig: ExtensionConfig;

  private onStateChangedCallback?: (state: string, elapsedToday: number) => void;

  constructor(dbService: DatabaseService, onStateChanged?: (state: string, elapsedToday: number) => void) {
    this.dbService = dbService;
    this.onStateChangedCallback = onStateChanged;
    this.sessionManager = new SessionManager();
    this.windowId = 'win_' + Math.random().toString(36).substring(2, 9);

    // Cache config once at startup — refreshed via updateConfig()
    this.cachedConfig = this.readConfig();

    // Initialize Idle Detector
    this.idleDetector = new IdleDetector(this.cachedConfig.idleTimeout, (isIdle) => {
      this.handleIdleStateChange(isIdle);
    });

    // Initialize sub-trackers
    this.gitTracker = new GitTracker(
      () => this.handleGitCommit(),
      (branch) => this.handleGitBranchChange(branch)
    );

    this.terminalTracker = new TerminalTracker(
      (cmdEvent) => this.handleTerminalCommand(cmdEvent),
      () => this.handleTerminalActivity()
    );

    this.workspaceTracker = new WorkspaceTracker(() => this.handleWorkspaceChange());
    this.fileTracker = new FileTracker();
    this.aiTracker = new AITracker(() => this.handleAIActivity());

    this.registerVscodeListeners();
    this.startNewSession();
    this.idleDetector.start();
    this.startTicks();
  }

  // Read config from VS Code settings (called sparingly)
  private readConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('devActivityTracker');
    return {
      idleTimeout: config.get<number>('idleTimeout') || 300,
      dailyGoal: config.get<number>('dailyGoal') || 14400,
      privacyMode: config.get<boolean>('privacyMode') || false,
      showStatusBar: config.get<boolean>('showStatusBar') || true,
      userId: config.get<string>('userId') || ''
    };
  }

  // Called by extension.ts on onDidChangeConfiguration
  public updateConfig(): void {
    this.cachedConfig = this.readConfig();
    this.idleDetector.updateTimeout(this.cachedConfig.idleTimeout);
  }

  private registerVscodeListeners() {
    this.disposables.push(
      // Document coding events
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme === 'file') {
          this.recordActivity('coding');
        }
      }),
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.scheme === 'file') {
          this.recordActivity('coding');
          this.sessionManager.addTimelineEvent(
            `Saved file: ${this.fileTracker.getFileName(doc.uri, this.cachedConfig.privacyMode)}`,
            'coding'
          );
        }
      }),

      // Cursor navigation / tab selection (Reading events)
      vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor.document.uri.scheme === 'file') {
          this.recordActivity('reading');
        }
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.uri.scheme === 'file') {
          this.recordActivity('reading');
          this.sessionManager.addTimelineEvent(
            `Opened file: ${this.fileTracker.getFileName(editor.document.uri, this.cachedConfig.privacyMode)}`,
            'reading'
          );
        }
      }),

      // Window focus changes
      vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
          this.recordActivity('reading');
        } else {
          this.handleWindowBlur();
        }
      }),

      // Debugging events
      vscode.debug.onDidStartDebugSession(() => {
        this.lastCodingTime = 0; // Prioritize debugging state
        this.sessionManager.recordDebugSessionStart();
        this.recordActivity('debugging');
      }),

    );

    this.registerTestResultListener();
  }

  private registerTestResultListener(): void {
    try {
      const testsNamespace = vscode.tests as any;
      if (testsNamespace && typeof testsNamespace.onDidChangeTestResults === 'function') {
        this.disposables.push(
          testsNamespace.onDidChangeTestResults(() => {
            this.lastTestingTime = Date.now();
            if (testsNamespace.testResults && testsNamespace.testResults.length > 0) {
              const latest = testsNamespace.testResults[0];
              let failed = 0;
              const countFailed = (tasks: readonly any[]) => {
                for (const t of tasks) {
                  if (t.taskStates) {
                    for (const ts of t.taskStates) {
                      if (ts.state === 'Failed' || ts.state === 'Errored') {
                        failed++;
                      }
                    }
                  }
                }
              };
              countFailed(latest.results || []);
              this.sessionManager.recordTestRun(failed === 0);
              this.recordActivity('testing');
            } else {
              this.sessionManager.recordTestRun(true);
              this.recordActivity('testing');
            }
          })
        );
      }
    } catch (e) {
      console.error('Error starting Test tracker:', e);
    }
  }

  private recordActivity(type: 'coding' | 'reading' | 'debugging' | 'terminal' | 'git' | 'testing' | 'ai') {
    const now = Date.now();
    this.idleDetector.recordActivity();

    switch (type) {
      case 'coding':     this.lastCodingTime = now; break;
      case 'terminal':   this.lastTerminalTime = now; break;
      case 'ai':         this.lastAITime = now; break;
      case 'git':        this.lastGitTime = now; break;
      case 'testing':    this.lastTestingTime = now; break;
    }
  }

  private handleIdleStateChange(isIdle: boolean) {
    if (isIdle) {
      this.sessionManager.addTimelineEvent('Developer went idle', 'idle');
      this.dbService.deleteActiveSession(this.windowId);
    } else {
      this.sessionManager.addTimelineEvent('Developer active', 'system');
      this.lastTickTime = Date.now();
      this.updateActiveSessionFile();
    }
  }

  private handleWindowBlur() {
    this.sessionManager.addTimelineEvent('Window focus lost (idle)', 'idle');
    this.dbService.deleteActiveSession(this.windowId);
  }

  private handleGitCommit() {
    this.lastGitTime = Date.now();
    this.sessionManager.recordGitCommit();
    this.recordActivity('git');
  }

  private handleGitBranchChange(branch: string) {
    this.lastGitTime = Date.now();
    this.sessionManager.recordBranchSwitch(branch);
    this.recordActivity('git');
    this.cycleSession();
  }

  private handleTerminalCommand(event: TerminalCommandEvent) {
    this.lastTerminalTime = Date.now();
    this.sessionManager.recordTerminalCommand(event.command, event.category);
    this.recordActivity('terminal');
  }

  private handleTerminalActivity() {
    this.lastTerminalTime = Date.now();
    this.recordActivity('terminal');
  }

  private handleAIActivity() {
    this.lastAITime = Date.now();
    this.sessionManager.recordAIActivity();
    this.recordActivity('ai');
  }

  private handleWorkspaceChange() {
    this.cycleSession();
  }

  private startTicks() {
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private stopTicks() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
    }
  }

  private updateActiveSessionFile() {
    const current = this.sessionManager.getCurrentSession();
    if (current) {
      const now = Date.now();
      const duration = Math.round((now - current.startTime) / 1000);
      const virtualSession = {
        ...current,
        duration,
        endTime: now
      };
      this.dbService.writeActiveSession(this.windowId, virtualSession);
    }
  }

  private tick() {
    const now = Date.now();
    const deltaSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    if (this.idleDetector.isIdle()) {
      return;
    }

    const currentSession = this.sessionManager.getCurrentSession();
    if (!currentSession) {
      this.startNewSession();
      return;
    }

    // Heuristically classify current activity state
    let activeState = 'reading';

    const isDashboardActive = !!(DashboardPanel.currentPanel && (DashboardPanel.currentPanel as any).panel?.active);
    const isTerminalFocused = !vscode.window.activeTextEditor && !!vscode.window.activeTerminal && vscode.window.state.focused && !isDashboardActive;

    if (isTerminalFocused) {
      this.lastTerminalTime = now;
    }

    if (vscode.debug.activeDebugSession) {
      activeState = 'debugging';
    } else if (now - this.lastAITime < 15000) {
      activeState = 'ai';
    } else if (now - this.lastTerminalTime < 30000) {
      activeState = 'terminal';
    } else if (now - this.lastGitTime < 15000) {
      activeState = 'git';
    } else if (now - this.lastTestingTime < 15000) {
      activeState = 'testing';
    } else if (now - this.lastCodingTime < 30000) {
      activeState = 'coding';
    }

    // Accumulate times
    this.sessionManager.updateSessionTimes(activeState, deltaSeconds);

    // Track active file details
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
      const relativePath = this.fileTracker.getRelativePath(activeEditor.document.uri, this.cachedConfig.privacyMode);
      const fileName = this.fileTracker.getFileName(activeEditor.document.uri, this.cachedConfig.privacyMode);
      const languageId = LanguageTracker.getLanguageName(activeEditor.document.languageId);
      const isEdit = (now - this.lastCodingTime < 1500);

      this.sessionManager.recordFileActivity(relativePath, fileName, languageId, isEdit, deltaSeconds);
    }

    // Track active terminals count
    this.sessionManager.recordTerminalSessionsCount(this.terminalTracker.getTerminalSessionsCount());

    // Periodically update active session file (every 5 seconds / ticks)
    this.ticksCount++;
    if (this.ticksCount % 5 === 0) {
      this.updateActiveSessionFile();
    }

    // Notify status bar & dashboard
    if (this.onStateChangedCallback) {
      this.onStateChangedCallback(activeState, this.getTodayAccumulatedTime());
    }
  }

  private startNewSession() {
    const ws = this.workspaceTracker.getWorkspaceDetails(this.cachedConfig.privacyMode);
    const gitDetails = this.gitTracker.getRepoDetails();
    this.sessionManager.startSession(ws.name, ws.path, gitDetails.repository, gitDetails.branch);
    this.lastTickTime = Date.now();
    this.updateActiveSessionFile();
  }

  private async endCurrentSession() {
    const session = this.sessionManager.endSession();
    if (session && session.duration > 5) {
      this.dbService.deleteActiveSession(this.windowId);
      this.dbService.addSession(session, this.cachedConfig.dailyGoal);
    }
  }

  private cycleSession() {
    this.endCurrentSession();
    this.startNewSession();
  }

  // Correct local-timezone date string
  private localDateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  public getTodayAccumulatedTime(): number {
    const dateStr = this.localDateString(new Date());
    const progress = this.dbService.getDatabase().dailyProgress[dateStr];
    let time = progress ? progress.developmentTime : 0;
    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      time += currentSession.duration;
    }
    return time;
  }

  public getTodayCodingTime(): number {
    const dateStr = this.localDateString(new Date());
    const progress = this.dbService.getDatabase().dailyProgress[dateStr];
    let time = progress ? progress.codingTime : 0;
    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      time += currentSession.codingTime;
    }
    return time;
  }

  public getActiveState(): string {
    if (this.idleDetector.isIdle()) { return 'Idle'; }
    const now = Date.now();
    if (vscode.debug.activeDebugSession)        { return 'Debugging'; }
    if (now - this.lastAITime < 15000)          { return 'AI Assisting'; }
    if (now - this.lastTerminalTime < 30000)    { return 'Terminal'; }
    if (now - this.lastGitTime < 15000)         { return 'Git'; }
    if (now - this.lastTestingTime < 15000)     { return 'Testing'; }
    if (now - this.lastCodingTime < 30000)      { return 'Coding'; }
    return 'Reading';
  }

  public getLiveDatabase(): any {
    const activeSessions = this.dbService.getActiveSessions();
    
    // Check if this window has a current active session and append it
    const current = this.sessionManager.getCurrentSession();
    if (current) {
      const now = Date.now();
      const duration = Math.round((now - current.startTime) / 1000);
      const virtualSession = {
        ...current,
        duration,
        endTime: now
      };
      
      // Prevent duplicating our own session if it was already written to disk
      if (!activeSessions.some((s: any) => s.id === virtualSession.id)) {
        activeSessions.push(virtualSession);
      }
    }
    
    return this.dbService.getMergedLiveDatabase(activeSessions, this.cachedConfig.dailyGoal);
  }

  public deactivate() {
    this.stopTicks();
    this.idleDetector.stop();
    this.endCurrentSession();
    this.dbService.deleteActiveSession(this.windowId);
    this.gitTracker.dispose();
    this.terminalTracker.dispose();
    this.workspaceTracker.dispose();
    this.fileTracker.dispose();
    this.aiTracker.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
