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

  private onStateChangedCallback?: (state: string, elapsedToday: number) => void;

  constructor(dbService: DatabaseService, onStateChanged?: (state: string, elapsedToday: number) => void) {
    this.dbService = dbService;
    this.onStateChangedCallback = onStateChanged;
    this.sessionManager = new SessionManager();

    const config = this.getConfig();

    // Initialize Idle Detector
    this.idleDetector = new IdleDetector(config.idleTimeout, (isIdle) => {
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

  private getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('devActivityTracker');
    return {
      idleTimeout: config.get<number>('idleTimeout') || 300,
      dailyGoal: config.get<number>('dailyGoal') || 14400,
      privacyMode: config.get<boolean>('privacyMode') || false,
      showStatusBar: config.get<boolean>('showStatusBar') || true
    };
  }

  public updateConfig(): void {
    const config = this.getConfig();
    this.idleDetector.updateTimeout(config.idleTimeout);
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
          this.sessionManager.addTimelineEvent(`Saved file: ${this.fileTracker.getFileName(doc.uri, this.getConfig().privacyMode)}`, 'coding');
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
          const config = this.getConfig();
          this.sessionManager.addTimelineEvent(`Opened file: ${this.fileTracker.getFileName(editor.document.uri, config.privacyMode)}`, 'reading');
        }
      }),

      // Window focus changes
      vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
          this.recordActivity('reading');
        } else {
          // Immediately trigger idle check or record inactive state
          this.handleWindowBlur();
        }
      }),

      // Debugging events
      vscode.debug.onDidStartDebugSession(() => {
        this.lastCodingTime = 0; // Prioritize debugging state
        this.sessionManager.recordDebugSessionStart();
        this.recordActivity('debugging');
      }),

      // Testing events
      vscode.tests.onDidChangeTestResults(() => {
        this.lastTestingTime = Date.now();
        // Determine test result status
        const latest = vscode.tests.testResults[0];
        if (latest) {
          // Basic success/failure mapping
          const success = true; // Simplified for metadata logic
          this.sessionManager.recordTestRun(success);
          this.recordActivity('testing');
        }
      })
    );
  }

  private recordActivity(type: 'coding' | 'reading' | 'debugging' | 'terminal' | 'git' | 'testing' | 'ai') {
    const now = Date.now();
    this.idleDetector.recordActivity();

    switch (type) {
      case 'coding':
        this.lastCodingTime = now;
        break;
      case 'debugging':
        // Handled via active debug sessions
        break;
      case 'terminal':
        this.lastTerminalTime = now;
        break;
      case 'ai':
        this.lastAITime = now;
        break;
      case 'git':
        this.lastGitTime = now;
        break;
      case 'testing':
        this.lastTestingTime = now;
        break;
    }
  }

  private handleIdleStateChange(isIdle: boolean) {
    if (isIdle) {
      this.sessionManager.addTimelineEvent('Developer went idle', 'idle');
      this.dbService.save(); // Save progress up to now
    } else {
      this.sessionManager.addTimelineEvent('Developer active', 'system');
      this.lastTickTime = Date.now();
    }
  }

  private handleWindowBlur() {
    // If window blurred, register it as idle immediately
    this.sessionManager.addTimelineEvent('Window focus lost (idle)', 'idle');
    this.dbService.save();
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
    
    // Cycle session on branch changes
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
    // Cycle session on workspace changes
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
      const config = this.getConfig();
      const relativePath = this.fileTracker.getRelativePath(activeEditor.document.uri, config.privacyMode);
      const fileName = this.fileTracker.getFileName(activeEditor.document.uri, config.privacyMode);
      const languageId = LanguageTracker.getLanguageName(activeEditor.document.languageId);
      
      const isEdit = (now - this.lastCodingTime < 1500);
      
      this.sessionManager.recordFileActivity(
        relativePath,
        fileName,
        languageId,
        isEdit,
        deltaSeconds
      );
    }

    // Track active terminals count
    this.sessionManager.recordTerminalSessionsCount(this.terminalTracker.getTerminalSessionsCount());

    // Update status bar & notify listeners
    if (this.onStateChangedCallback) {
      this.onStateChangedCallback(activeState, this.getTodayAccumulatedTime());
    }
  }

  private startNewSession() {
    const config = this.getConfig();
    const ws = this.workspaceTracker.getWorkspaceDetails(config.privacyMode);
    const gitDetails = this.gitTracker.getRepoDetails();

    this.sessionManager.startSession(
      ws.name,
      ws.path,
      gitDetails.repository,
      gitDetails.branch
    );
    this.lastTickTime = Date.now();
  }

  private endCurrentSession() {
    const session = this.sessionManager.endSession();
    if (session && session.duration > 5) { // Only log meaningful sessions (> 5 seconds)
      const config = this.getConfig();
      this.dbService.addSession(session, config.dailyGoal);
    }
  }

  private cycleSession() {
    this.endCurrentSession();
    this.startNewSession();
  }

  public getTodayAccumulatedTime(): number {
    const dateStr = new Date().toISOString().slice(0, 10);
    const progress = this.dbService.getDatabase().dailyProgress[dateStr];
    let time = progress ? progress.developmentTime : 0;
    
    // Add current session's active duration
    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      time += currentSession.duration;
    }
    
    return time;
  }

  public getTodayCodingTime(): number {
    const dateStr = new Date().toISOString().slice(0, 10);
    const progress = this.dbService.getDatabase().dailyProgress[dateStr];
    let time = progress ? progress.codingTime : 0;

    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      time += currentSession.codingTime;
    }

    return time;
  }

  public getActiveState(): string {
    if (this.idleDetector.isIdle()) {
      return 'Idle';
    }
    const now = Date.now();
    if (vscode.debug.activeDebugSession) {
      return 'Debugging';
    } else if (now - this.lastAITime < 15000) {
      return 'AI Assisting';
    } else if (now - this.lastTerminalTime < 30000) {
      return 'Terminal';
    } else if (now - this.lastGitTime < 15000) {
      return 'Git';
    } else if (now - this.lastTestingTime < 15000) {
      return 'Testing';
    } else if (now - this.lastCodingTime < 30000) {
      return 'Coding';
    }
    return 'Reading';
  }

  public deactivate() {
    this.stopTicks();
    this.idleDetector.stop();
    this.endCurrentSession();
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
