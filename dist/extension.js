"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode10 = __toESM(require("vscode"));

// src/storage/database.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var DatabaseService = class {
  dbPath;
  backupDir;
  db;
  constructor(storagePath) {
    this.dbPath = path.join(storagePath, "db.json");
    this.backupDir = path.join(storagePath, "backups");
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    this.db = this.loadDatabase();
  }
  loadDatabase() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, "utf8");
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to load database. Attempting recovery from backup...", e);
        return this.recoverFromLatestBackup();
      }
    }
    return this.createDefaultDatabase();
  }
  recoverFromLatestBackup() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter((f) => f.startsWith("db_backup_") && f.endsWith(".json")).sort((a, b) => b.localeCompare(a));
      if (backupFiles.length > 0) {
        const latestBackup = path.join(this.backupDir, backupFiles[0]);
        const raw = fs.readFileSync(latestBackup, "utf8");
        const db = JSON.parse(raw);
        console.log(`Recovered from backup: ${latestBackup}`);
        return db;
      }
    } catch (e) {
      console.error("Backup recovery failed:", e);
    }
    return this.createDefaultDatabase();
  }
  createDefaultDatabase() {
    return {
      version: 1,
      sessions: [],
      projects: {},
      dailyProgress: {},
      streaks: {
        coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: "" },
        development: { currentStreak: 0, longestStreak: 0, lastActiveDate: "" }
      }
    };
  }
  save() {
    try {
      const tempPath = this.dbPath + ".tmp";
      const data = JSON.stringify(this.db, null, 2);
      fs.writeFileSync(tempPath, data, "utf8");
      fs.renameSync(tempPath, this.dbPath);
    } catch (e) {
      console.error("Error saving database atomically:", e);
    }
  }
  getDatabase() {
    return this.db;
  }
  addSession(session, dailyGoalSeconds) {
    this.db.sessions.push(session);
    this.updateProjectStats(session);
    this.updateDailyProgress(session, dailyGoalSeconds);
    this.updateStreaks(session);
    this.save();
    if (Math.random() < 0.1) {
      this.backup();
    }
  }
  updateProjectStats(session) {
    const projName = session.workspaceName || "Unknown Project";
    if (!this.db.projects[projName]) {
      this.db.projects[projName] = {
        name: projName,
        repository: session.repository,
        totalTime: 0,
        todayTime: 0,
        weeklyTime: 0,
        monthlyTime: 0,
        editsCount: 0,
        readsCount: 0,
        commitsCount: 0,
        terminalTime: 0,
        aiTime: 0,
        languages: {},
        files: {},
        branches: []
      };
    }
    const p = this.db.projects[projName];
    p.totalTime += session.duration;
    p.editsCount += session.editsCount;
    p.readsCount += session.readsCount;
    p.commitsCount += session.gitCommitsCount;
    p.terminalTime += session.terminalTime;
    p.aiTime += session.aiTime;
    if (session.branch && !p.branches.includes(session.branch)) {
      p.branches.push(session.branch);
    }
    for (const [lang, sec] of Object.entries(session.languages)) {
      p.languages[lang] = (p.languages[lang] || 0) + sec;
    }
    for (const [file, stats] of Object.entries(session.files)) {
      p.files[file] = (p.files[file] || 0) + stats.timeSpent;
    }
    this.recalculateProjectIntervalTimes(projName);
  }
  recalculateProjectIntervalTimes(projName) {
    const p = this.db.projects[projName];
    if (!p) {
      return;
    }
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1e3;
    p.todayTime = 0;
    p.weeklyTime = 0;
    p.monthlyTime = 0;
    const todayStr = this.formatDate(new Date(now));
    const startOfWeek = now - 7 * oneDay;
    const startOfMonth = now - 30 * oneDay;
    for (const s of this.db.sessions) {
      if (s.workspaceName !== projName) {
        continue;
      }
      const sDate = this.formatDate(new Date(s.startTime));
      if (sDate === todayStr) {
        p.todayTime += s.duration;
      }
      if (s.startTime >= startOfWeek) {
        p.weeklyTime += s.duration;
      }
      if (s.startTime >= startOfMonth) {
        p.monthlyTime += s.duration;
      }
    }
  }
  updateDailyProgress(session, dailyGoalSeconds) {
    const dateStr = this.formatDate(new Date(session.startTime));
    if (!this.db.dailyProgress[dateStr]) {
      this.db.dailyProgress[dateStr] = {
        date: dateStr,
        codingTime: 0,
        developmentTime: 0,
        goalSeconds: dailyGoalSeconds,
        isCompleted: false,
        sessionsCount: 0,
        commitsCount: 0,
        terminalTime: 0,
        aiTime: 0,
        projects: {},
        languages: {}
      };
    }
    const dp = this.db.dailyProgress[dateStr];
    dp.codingTime += session.codingTime;
    dp.developmentTime += session.duration;
    dp.sessionsCount += 1;
    dp.commitsCount += session.gitCommitsCount;
    dp.terminalTime += session.terminalTime;
    dp.aiTime += session.aiTime;
    const projName = session.workspaceName || "Unknown Project";
    dp.projects[projName] = (dp.projects[projName] || 0) + session.duration;
    for (const [lang, sec] of Object.entries(session.languages)) {
      dp.languages[lang] = (dp.languages[lang] || 0) + sec;
    }
    dp.isCompleted = dp.developmentTime >= dp.goalSeconds;
  }
  updateStreaks(session) {
    const todayStr = this.formatDate(new Date(session.startTime));
    if (session.codingTime > 0) {
      this.db.streaks.coding = this.calculateStreak(this.db.streaks.coding, todayStr);
    }
    this.db.streaks.development = this.calculateStreak(this.db.streaks.development, todayStr);
  }
  calculateStreak(streak, todayStr) {
    const lastActive = streak.lastActiveDate;
    if (lastActive === todayStr) {
      return streak;
    }
    if (lastActive === "") {
      return {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: todayStr
      };
    }
    const lastDate = new Date(lastActive);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    let newCurrent = streak.currentStreak;
    if (diffDays === 1) {
      newCurrent += 1;
    } else if (diffDays > 1) {
      newCurrent = 1;
    }
    const newLongest = Math.max(streak.longestStreak, newCurrent);
    return {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActiveDate: todayStr
    };
  }
  // Backup methods
  backup() {
    try {
      const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
      const backupPath = path.join(this.backupDir, `db_backup_${dateStr}_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(this.db, null, 2), "utf8");
      const files = fs.readdirSync(this.backupDir).filter((f) => f.startsWith("db_backup_") && f.endsWith(".json")).map((f) => path.join(this.backupDir, f));
      if (files.length > 5) {
        files.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
        const toDelete = files.slice(0, files.length - 5);
        for (const f of toDelete) {
          fs.unlinkSync(f);
        }
      }
      return backupPath;
    } catch (e) {
      console.error("Backup failed:", e);
      throw e;
    }
  }
  restore(backupPath) {
    try {
      const raw = fs.readFileSync(backupPath, "utf8");
      const backupDb = JSON.parse(raw);
      if (backupDb.version && Array.isArray(backupDb.sessions)) {
        this.db = backupDb;
        this.save();
      } else {
        throw new Error("Invalid database format");
      }
    } catch (e) {
      console.error("Restore failed:", e);
      throw e;
    }
  }
  merge(mergePath) {
    try {
      const raw = fs.readFileSync(mergePath, "utf8");
      const mergeDb = JSON.parse(raw);
      if (!mergeDb.version || !Array.isArray(mergeDb.sessions)) {
        throw new Error("Invalid merge file format");
      }
      const currentSessionIds = new Set(this.db.sessions.map((s) => s.id));
      for (const s of mergeDb.sessions) {
        if (!currentSessionIds.has(s.id)) {
          this.db.sessions.push(s);
        }
      }
      this.rebuildAllStats();
      this.save();
    } catch (e) {
      console.error("Merge failed:", e);
      throw e;
    }
  }
  rebuildAllStats() {
    this.db.projects = {};
    this.db.dailyProgress = {};
    this.db.streaks = {
      coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: "" },
      development: { currentStreak: 0, longestStreak: 0, lastActiveDate: "" }
    };
    this.db.sessions.sort((a, b) => a.startTime - b.startTime);
    for (const s of this.db.sessions) {
      this.updateProjectStats(s);
      this.updateDailyProgress(s, 14400);
      this.updateStreaks(s);
    }
  }
  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
};

// src/tracking/tracker.ts
var vscode6 = __toESM(require("vscode"));

// src/sessions/sessionManager.ts
var SessionManager = class {
  currentSession = null;
  startSession(workspaceName, workspacePath, repository, branch) {
    const now = Date.now();
    const id = `session_${now}_${Math.random().toString(36).substring(2, 9)}`;
    this.currentSession = {
      id,
      startTime: now,
      endTime: now,
      duration: 0,
      workspaceName,
      workspacePath,
      repository,
      branch,
      codingTime: 0,
      readingTime: 0,
      debuggingTime: 0,
      terminalTime: 0,
      gitTime: 0,
      testingTime: 0,
      aiTime: 0,
      editsCount: 0,
      readsCount: 0,
      files: {},
      languages: {},
      terminalCommands: [],
      terminalSessionsCount: 0,
      gitCommitsCount: 0,
      debugSessionsCount: 0,
      testRunsSuccess: 0,
      testRunsFailed: 0,
      timeline: [
        {
          timestamp: now,
          description: "VS Code Session Started",
          category: "system"
        }
      ]
    };
    return this.currentSession;
  }
  getCurrentSession() {
    return this.currentSession;
  }
  updateSessionTimes(activeCategory, deltaSeconds) {
    if (!this.currentSession) {
      return;
    }
    this.currentSession.duration += deltaSeconds;
    this.currentSession.endTime = Date.now();
    switch (activeCategory) {
      case "coding":
        this.currentSession.codingTime += deltaSeconds;
        break;
      case "reading":
        this.currentSession.readingTime += deltaSeconds;
        break;
      case "debugging":
        this.currentSession.debuggingTime += deltaSeconds;
        break;
      case "terminal":
        this.currentSession.terminalTime += deltaSeconds;
        break;
      case "git":
        this.currentSession.gitTime += deltaSeconds;
        break;
      case "testing":
        this.currentSession.testingTime += deltaSeconds;
        break;
      case "ai":
        this.currentSession.aiTime += deltaSeconds;
        break;
    }
  }
  recordFileActivity(relativePath, fileName, languageId, isEdit, deltaSeconds) {
    if (!this.currentSession) {
      return;
    }
    if (!this.currentSession.files[relativePath]) {
      this.currentSession.files[relativePath] = {
        relativePath,
        fileName,
        languageId,
        timeSpent: 0,
        editsCount: 0,
        readsCount: 0,
        lastActive: Date.now()
      };
    }
    const file = this.currentSession.files[relativePath];
    file.timeSpent += deltaSeconds;
    file.lastActive = Date.now();
    if (isEdit) {
      file.editsCount += 1;
      this.currentSession.editsCount += 1;
    } else {
      file.readsCount += 1;
      this.currentSession.readsCount += 1;
    }
    if (languageId) {
      this.currentSession.languages[languageId] = (this.currentSession.languages[languageId] || 0) + deltaSeconds;
    }
  }
  recordTerminalCommand(command, category) {
    if (!this.currentSession) {
      return;
    }
    const cmdEvent = {
      command,
      category,
      timestamp: Date.now()
    };
    this.currentSession.terminalCommands.push(cmdEvent);
    this.addTimelineEvent(`Executed Terminal Command: ${command.slice(0, 30)}${command.length > 30 ? "..." : ""}`, "terminal");
  }
  recordGitCommit() {
    if (!this.currentSession) {
      return;
    }
    this.currentSession.gitCommitsCount += 1;
    this.addTimelineEvent("Git Commit Detected", "git");
  }
  recordBranchSwitch(branch) {
    if (!this.currentSession) {
      return;
    }
    this.currentSession.branch = branch;
    this.addTimelineEvent(`Switched Git Branch to ${branch}`, "git");
  }
  recordDebugSessionStart() {
    if (!this.currentSession) {
      return;
    }
    this.currentSession.debugSessionsCount += 1;
    this.addTimelineEvent("Debugging Started", "debugging");
  }
  recordTestRun(success) {
    if (!this.currentSession) {
      return;
    }
    if (success) {
      this.currentSession.testRunsSuccess += 1;
      this.addTimelineEvent("Testing Succeeded", "testing");
    } else {
      this.currentSession.testRunsFailed += 1;
      this.addTimelineEvent("Testing Failed", "testing");
    }
  }
  recordAIActivity() {
    if (!this.currentSession) {
      return;
    }
    this.addTimelineEvent("AI Assistant Used", "ai");
  }
  addTimelineEvent(description, category) {
    if (!this.currentSession) {
      return;
    }
    const now = Date.now();
    const lastEvent = this.currentSession.timeline[this.currentSession.timeline.length - 1];
    if (lastEvent && lastEvent.description === description && now - lastEvent.timestamp < 1e4) {
      return;
    }
    this.currentSession.timeline.push({
      timestamp: now,
      description,
      category
    });
  }
  recordTerminalSessionsCount(count) {
    if (!this.currentSession) {
      return;
    }
    this.currentSession.terminalSessionsCount = Math.max(this.currentSession.terminalSessionsCount, count);
  }
  endSession() {
    if (!this.currentSession) {
      return null;
    }
    const session = this.currentSession;
    session.endTime = Date.now();
    session.timeline.push({
      timestamp: session.endTime,
      description: "VS Code Session Ended",
      category: "system"
    });
    this.currentSession = null;
    return session;
  }
};

// src/tracking/idleDetector.ts
var IdleDetector = class {
  timeoutMs;
  lastActivityTime;
  isIdleState;
  intervalId;
  onIdleStateChanged;
  constructor(timeoutSeconds, onIdleStateChanged) {
    this.timeoutMs = timeoutSeconds * 1e3;
    this.lastActivityTime = Date.now();
    this.isIdleState = false;
    this.onIdleStateChanged = onIdleStateChanged;
  }
  start() {
    this.lastActivityTime = Date.now();
    this.isIdleState = false;
    this.intervalId = setInterval(() => {
      this.checkIdle();
    }, 1e3);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = void 0;
    }
  }
  updateTimeout(timeoutSeconds) {
    this.timeoutMs = timeoutSeconds * 1e3;
  }
  recordActivity() {
    this.lastActivityTime = Date.now();
    if (this.isIdleState) {
      this.isIdleState = false;
      this.onIdleStateChanged(false);
    }
  }
  checkIdle() {
    if (this.isIdleState) {
      return;
    }
    const now = Date.now();
    if (now - this.lastActivityTime >= this.timeoutMs) {
      this.isIdleState = true;
      this.onIdleStateChanged(true);
    }
  }
  isIdle() {
    return this.isIdleState;
  }
  getLastActivityTime() {
    return this.lastActivityTime;
  }
};

// src/git/gitTracker.ts
var vscode = __toESM(require("vscode"));
var path2 = __toESM(require("path"));
var GitTracker = class {
  gitApi;
  disposables = [];
  onCommitCallback;
  onBranchChangeCallback;
  constructor(onCommit, onBranchChange) {
    this.onCommitCallback = onCommit;
    this.onBranchChangeCallback = onBranchChange;
    this.initGitExtension();
  }
  initGitExtension() {
    try {
      const gitExtension = vscode.extensions.getExtension("vscode.git");
      if (gitExtension) {
        if (!gitExtension.isActive) {
          gitExtension.activate().then(() => this.setupGit(gitExtension.exports));
        } else {
          this.setupGit(gitExtension.exports);
        }
      }
    } catch (e) {
      console.error("Failed to initialize Git Tracker:", e);
    }
  }
  setupGit(gitExports) {
    try {
      this.gitApi = gitExports.getAPI(1);
      if (this.gitApi) {
        this.disposables.push(this.gitApi.onDidOpenRepository((repo) => {
          this.subscribeToRepo(repo);
        }));
        for (const repo of this.gitApi.repositories) {
          this.subscribeToRepo(repo);
        }
      }
    } catch (e) {
      console.error("Error setting up Git tracking:", e);
    }
  }
  subscribeToRepo(repo) {
    try {
      let lastCommitHash = repo.state.HEAD?.commit;
      let lastBranch = repo.state.HEAD?.name;
      this.disposables.push(repo.state.onDidChange(() => {
        const currentBranch = repo.state.HEAD?.name;
        const currentCommit = repo.state.HEAD?.commit;
        if (currentBranch && currentBranch !== lastBranch) {
          lastBranch = currentBranch;
          this.onBranchChangeCallback(currentBranch);
        }
        if (currentCommit && currentCommit !== lastCommitHash) {
          lastCommitHash = currentCommit;
          this.onCommitCallback();
        }
      }));
    } catch (e) {
      console.error("Error subscribing to repository events:", e);
    }
  }
  getRepoDetails() {
    if (!this.gitApi || this.gitApi.repositories.length === 0) {
      return { repository: "", branch: "" };
    }
    const repo = this.gitApi.repositories[0];
    let repository = "";
    if (repo && repo.rootUri) {
      repository = path2.basename(repo.rootUri.fsPath);
    }
    const branch = repo && repo.state.HEAD ? repo.state.HEAD.name || "" : "";
    return { repository, branch };
  }
  dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
};

// src/terminal/terminalTracker.ts
var vscode2 = __toESM(require("vscode"));
var TerminalTracker = class {
  disposables = [];
  onCommandCallback;
  onTerminalActiveCallback;
  constructor(onCommand, onTerminalActive) {
    this.onCommandCallback = onCommand;
    this.onTerminalActiveCallback = onTerminalActive;
    this.initTerminalTracking();
  }
  initTerminalTracking() {
    this.disposables.push(
      vscode2.window.onDidOpenTerminal(() => {
        this.onTerminalActiveCallback();
      }),
      vscode2.window.onDidCloseTerminal(() => {
        this.onTerminalActiveCallback();
      }),
      vscode2.window.onDidChangeActiveTerminal(() => {
        this.onTerminalActiveCallback();
      })
    );
    if ("onDidStartTerminalShellExecution" in vscode2.window) {
      try {
        const win = vscode2.window;
        this.disposables.push(
          win.onDidStartTerminalShellExecution((event) => {
            const command = event.commandLine && event.commandLine.value || "";
            if (command) {
              const category = this.categorizeCommand(command);
              this.onCommandCallback({
                command,
                category,
                timestamp: Date.now()
              });
            }
          })
        );
      } catch (e) {
        console.error("Error starting terminal shell execution tracking:", e);
      }
    }
  }
  categorizeCommand(command) {
    const cmd = command.trim().toLowerCase();
    if (cmd.startsWith("npm install") || cmd.startsWith("npm i ") || cmd === "npm i" || cmd.startsWith("yarn install") || cmd.startsWith("yarn add") || cmd.startsWith("pnpm install") || cmd.startsWith("pnpm add") || cmd.startsWith("bun install") || cmd.startsWith("bun add") || cmd.startsWith("pip install") || cmd.startsWith("pipenv install") || cmd.startsWith("cargo add") || cmd.startsWith("go get")) {
      return "package-manager";
    }
    if (cmd.startsWith("git ")) {
      return "git";
    }
    if (cmd.startsWith("docker ") || cmd.startsWith("docker-compose ") || cmd.startsWith("docker compose ") || cmd.startsWith("kubectl ")) {
      return "docker";
    }
    if (cmd.includes("test") || cmd.includes("jest") || cmd.includes("mocha") || cmd.includes("vitest") || cmd.includes("pytest") || cmd.includes("playwright") || cmd.includes("cypress")) {
      return "test";
    }
    if (cmd.includes("run dev") || cmd.startsWith("npm start") || cmd.startsWith("yarn start") || cmd.startsWith("pnpm start") || cmd.includes("serve") || cmd.includes("watch")) {
      return "dev";
    }
    if (cmd.includes("build") || cmd.includes("compile") || cmd.includes("webpack") || cmd.includes("esbuild") || cmd.includes("tsc ") || cmd === "tsc") {
      return "build";
    }
    return "other";
  }
  getTerminalSessionsCount() {
    return vscode2.window.terminals.length;
  }
  dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
};

// src/workspace/workspaceTracker.ts
var vscode3 = __toESM(require("vscode"));
var path3 = __toESM(require("path"));
var WorkspaceTracker = class {
  disposables = [];
  onWorkspaceChangeCallback;
  constructor(onWorkspaceChange) {
    this.onWorkspaceChangeCallback = onWorkspaceChange;
    this.initWorkspaceTracking();
  }
  initWorkspaceTracking() {
    this.disposables.push(
      vscode3.workspace.onDidChangeWorkspaceFolders(() => {
        this.onWorkspaceChangeCallback();
      })
    );
  }
  getWorkspaceDetails(privacyMode = false) {
    const folders = vscode3.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return { name: "No Workspace", path: "" };
    }
    const firstFolder = folders[0];
    const originalName = firstFolder.name || path3.basename(firstFolder.uri.fsPath);
    const originalPath = firstFolder.uri.fsPath;
    if (privacyMode) {
      const obscuredName = `Project_${this.simpleHash(originalName)}`;
      return {
        name: obscuredName,
        path: `C:\\private\\${obscuredName}`
      };
    }
    return {
      name: originalName,
      path: originalPath
    };
  }
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
  }
  dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
};

// src/files/fileTracker.ts
var vscode4 = __toESM(require("vscode"));
var path4 = __toESM(require("path"));
var FileTracker = class {
  disposables = [];
  getRelativePath(uri, privacyMode = false) {
    const relative = vscode4.workspace.asRelativePath(uri);
    if (!privacyMode) {
      return relative;
    }
    const parts = relative.split(/[/\\]/);
    const obscuredParts = parts.map((part, index) => {
      if (index === parts.length - 1) {
        const ext = path4.extname(part);
        const nameWithoutExt = path4.basename(part, ext);
        return `file_${this.simpleHash(nameWithoutExt)}${ext}`;
      }
      return `dir_${this.simpleHash(part)}`;
    });
    return obscuredParts.join("/");
  }
  getFileName(uri, privacyMode = false) {
    const basename6 = path4.basename(uri.fsPath);
    if (!privacyMode) {
      return basename6;
    }
    const ext = path4.extname(basename6);
    const nameWithoutExt = path4.basename(basename6, ext);
    return `file_${this.simpleHash(nameWithoutExt)}${ext}`;
  }
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
  }
  dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
};

// src/ai/aiTracker.ts
var vscode5 = __toESM(require("vscode"));
var AITracker = class {
  disposables = [];
  onAICallback;
  constructor(onAIActivity) {
    this.onAICallback = onAIActivity;
    this.initAITracking();
  }
  initAITracking() {
    try {
      this.disposables.push(
        vscode5.commands.onDidExecuteCommand((event) => {
          const cmd = event.command || "";
          if (this.isAICommand(cmd)) {
            this.onAICallback();
          }
        })
      );
    } catch (e) {
      console.error("Error starting AI command tracker:", e);
    }
  }
  isAICommand(command) {
    const cmd = command.toLowerCase();
    return cmd.startsWith("github.copilot") || cmd.startsWith("inlinechat.") || cmd.startsWith("workbench.action.chat") || cmd.startsWith("continue.") || cmd.startsWith("cline.") || cmd.startsWith("codeium.") || cmd.startsWith("amazonq.") || cmd.startsWith("tabnine.") || cmd.includes(".chat.") || cmd.includes("copilot.chat");
  }
  dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
};

// src/languages/languageTracker.ts
var LanguageTracker = class {
  static languageMap = {
    "javascript": "JavaScript",
    "javascriptreact": "React JSX",
    "typescript": "TypeScript",
    "typescriptreact": "TypeScript JSX (TSX)",
    "python": "Python",
    "java": "Java",
    "c": "C",
    "cpp": "C++",
    "go": "Go",
    "rust": "Rust",
    "php": "PHP",
    "html": "HTML",
    "css": "CSS",
    "scss": "SCSS",
    "json": "JSON",
    "yaml": "YAML",
    "markdown": "Markdown",
    "sql": "SQL",
    "shellscript": "Shell",
    "dockerfile": "Dockerfile",
    "xml": "XML",
    "csharp": "C#",
    "swift": "Swift",
    "ruby": "Ruby",
    "kotlin": "Kotlin",
    "perl": "Perl",
    "dart": "Dart",
    "powershell": "PowerShell",
    "makefile": "Makefile",
    "toml": "TOML",
    "ini": "INI",
    "git-commit": "Git Commit",
    "git-rebase": "Git Rebase"
  };
  static getLanguageName(languageId) {
    return this.languageMap[languageId.toLowerCase()] || this.capitalize(languageId);
  }
  static capitalize(str) {
    if (!str) {
      return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// src/tracking/tracker.ts
var Tracker = class {
  dbService;
  sessionManager;
  idleDetector;
  gitTracker;
  terminalTracker;
  workspaceTracker;
  fileTracker;
  aiTracker;
  disposables = [];
  tickInterval;
  lastCodingTime = 0;
  lastAITime = 0;
  lastTerminalTime = 0;
  lastGitTime = 0;
  lastTestingTime = 0;
  lastTickTime = 0;
  onStateChangedCallback;
  constructor(dbService, onStateChanged) {
    this.dbService = dbService;
    this.onStateChangedCallback = onStateChanged;
    this.sessionManager = new SessionManager();
    const config = this.getConfig();
    this.idleDetector = new IdleDetector(config.idleTimeout, (isIdle) => {
      this.handleIdleStateChange(isIdle);
    });
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
  getConfig() {
    const config = vscode6.workspace.getConfiguration("devActivityTracker");
    return {
      idleTimeout: config.get("idleTimeout") || 300,
      dailyGoal: config.get("dailyGoal") || 14400,
      privacyMode: config.get("privacyMode") || false,
      showStatusBar: config.get("showStatusBar") || true
    };
  }
  updateConfig() {
    const config = this.getConfig();
    this.idleDetector.updateTimeout(config.idleTimeout);
  }
  registerVscodeListeners() {
    this.disposables.push(
      // Document coding events
      vscode6.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme === "file") {
          this.recordActivity("coding");
        }
      }),
      vscode6.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.scheme === "file") {
          this.recordActivity("coding");
          this.sessionManager.addTimelineEvent(`Saved file: ${this.fileTracker.getFileName(doc.uri, this.getConfig().privacyMode)}`, "coding");
        }
      }),
      // Cursor navigation / tab selection (Reading events)
      vscode6.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor.document.uri.scheme === "file") {
          this.recordActivity("reading");
        }
      }),
      vscode6.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.uri.scheme === "file") {
          this.recordActivity("reading");
          const config = this.getConfig();
          this.sessionManager.addTimelineEvent(`Opened file: ${this.fileTracker.getFileName(editor.document.uri, config.privacyMode)}`, "reading");
        }
      }),
      // Window focus changes
      vscode6.window.onDidChangeWindowState((state) => {
        if (state.focused) {
          this.recordActivity("reading");
        } else {
          this.handleWindowBlur();
        }
      }),
      // Debugging events
      vscode6.debug.onDidStartDebugSession(() => {
        this.lastCodingTime = 0;
        this.sessionManager.recordDebugSessionStart();
        this.recordActivity("debugging");
      }),
      // Testing events
      vscode6.tests.onDidChangeTestResults(() => {
        this.lastTestingTime = Date.now();
        const latest = vscode6.tests.testResults[0];
        if (latest) {
          const success = true;
          this.sessionManager.recordTestRun(success);
          this.recordActivity("testing");
        }
      })
    );
  }
  recordActivity(type) {
    const now = Date.now();
    this.idleDetector.recordActivity();
    switch (type) {
      case "coding":
        this.lastCodingTime = now;
        break;
      case "debugging":
        break;
      case "terminal":
        this.lastTerminalTime = now;
        break;
      case "ai":
        this.lastAITime = now;
        break;
      case "git":
        this.lastGitTime = now;
        break;
      case "testing":
        this.lastTestingTime = now;
        break;
    }
  }
  handleIdleStateChange(isIdle) {
    if (isIdle) {
      this.sessionManager.addTimelineEvent("Developer went idle", "idle");
      this.dbService.save();
    } else {
      this.sessionManager.addTimelineEvent("Developer active", "system");
      this.lastTickTime = Date.now();
    }
  }
  handleWindowBlur() {
    this.sessionManager.addTimelineEvent("Window focus lost (idle)", "idle");
    this.dbService.save();
  }
  handleGitCommit() {
    this.lastGitTime = Date.now();
    this.sessionManager.recordGitCommit();
    this.recordActivity("git");
  }
  handleGitBranchChange(branch) {
    this.lastGitTime = Date.now();
    this.sessionManager.recordBranchSwitch(branch);
    this.recordActivity("git");
    this.cycleSession();
  }
  handleTerminalCommand(event) {
    this.lastTerminalTime = Date.now();
    this.sessionManager.recordTerminalCommand(event.command, event.category);
    this.recordActivity("terminal");
  }
  handleTerminalActivity() {
    this.lastTerminalTime = Date.now();
    this.recordActivity("terminal");
  }
  handleAIActivity() {
    this.lastAITime = Date.now();
    this.sessionManager.recordAIActivity();
    this.recordActivity("ai");
  }
  handleWorkspaceChange() {
    this.cycleSession();
  }
  startTicks() {
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1e3);
  }
  stopTicks() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = void 0;
    }
  }
  tick() {
    const now = Date.now();
    const deltaSeconds = (now - this.lastTickTime) / 1e3;
    this.lastTickTime = now;
    if (this.idleDetector.isIdle()) {
      return;
    }
    const currentSession = this.sessionManager.getCurrentSession();
    if (!currentSession) {
      this.startNewSession();
      return;
    }
    let activeState = "reading";
    if (vscode6.debug.activeDebugSession) {
      activeState = "debugging";
    } else if (now - this.lastAITime < 15e3) {
      activeState = "ai";
    } else if (now - this.lastTerminalTime < 3e4) {
      activeState = "terminal";
    } else if (now - this.lastGitTime < 15e3) {
      activeState = "git";
    } else if (now - this.lastTestingTime < 15e3) {
      activeState = "testing";
    } else if (now - this.lastCodingTime < 3e4) {
      activeState = "coding";
    }
    this.sessionManager.updateSessionTimes(activeState, deltaSeconds);
    const activeEditor = vscode6.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === "file") {
      const config = this.getConfig();
      const relativePath = this.fileTracker.getRelativePath(activeEditor.document.uri, config.privacyMode);
      const fileName = this.fileTracker.getFileName(activeEditor.document.uri, config.privacyMode);
      const languageId = LanguageTracker.getLanguageName(activeEditor.document.languageId);
      const isEdit = now - this.lastCodingTime < 1500;
      this.sessionManager.recordFileActivity(
        relativePath,
        fileName,
        languageId,
        isEdit,
        deltaSeconds
      );
    }
    this.sessionManager.recordTerminalSessionsCount(this.terminalTracker.getTerminalSessionsCount());
    if (this.onStateChangedCallback) {
      this.onStateChangedCallback(activeState, this.getTodayAccumulatedTime());
    }
  }
  startNewSession() {
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
  endCurrentSession() {
    const session = this.sessionManager.endSession();
    if (session && session.duration > 5) {
      const config = this.getConfig();
      this.dbService.addSession(session, config.dailyGoal);
    }
  }
  cycleSession() {
    this.endCurrentSession();
    this.startNewSession();
  }
  getTodayAccumulatedTime() {
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const progress = this.dbService.getDatabase().dailyProgress[dateStr];
    let time = progress ? progress.developmentTime : 0;
    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      time += currentSession.duration;
    }
    return time;
  }
  getTodayCodingTime() {
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const progress = this.dbService.getDatabase().dailyProgress[dateStr];
    let time = progress ? progress.codingTime : 0;
    const currentSession = this.sessionManager.getCurrentSession();
    if (currentSession) {
      time += currentSession.codingTime;
    }
    return time;
  }
  getActiveState() {
    if (this.idleDetector.isIdle()) {
      return "Idle";
    }
    const now = Date.now();
    if (vscode6.debug.activeDebugSession) {
      return "Debugging";
    } else if (now - this.lastAITime < 15e3) {
      return "AI Assisting";
    } else if (now - this.lastTerminalTime < 3e4) {
      return "Terminal";
    } else if (now - this.lastGitTime < 15e3) {
      return "Git";
    } else if (now - this.lastTestingTime < 15e3) {
      return "Testing";
    } else if (now - this.lastCodingTime < 3e4) {
      return "Coding";
    }
    return "Reading";
  }
  deactivate() {
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
};

// src/statusbar/statusbar.ts
var vscode7 = __toESM(require("vscode"));
var StatusbarManager = class {
  statusBarItem;
  dbService;
  constructor(dbService) {
    this.dbService = dbService;
    this.statusBarItem = vscode7.window.createStatusBarItem(
      vscode7.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "dev-activity-tracker.showDashboard";
    this.statusBarItem.tooltip = "Developer Activity Analytics - Click to open Dashboard";
    this.update("Reading", 0);
    this.statusBarItem.show();
  }
  update(state, secondsToday) {
    const config = vscode7.workspace.getConfiguration("devActivityTracker");
    const showStatusBar = config.get("showStatusBar") ?? true;
    if (!showStatusBar) {
      this.statusBarItem.hide();
      return;
    }
    const hours = Math.floor(secondsToday / 3600);
    const minutes = Math.floor(secondsToday % 3600 / 60);
    const streak = this.dbService.getDatabase().streaks.development.currentStreak;
    const timeStr = `${hours}h ${minutes}m`;
    const icon = this.getStateIcon(state);
    this.statusBarItem.text = `\u{1F4BB} Today ${timeStr} | ${icon} ${state} | \u{1F525} ${streak}d`;
    this.statusBarItem.show();
  }
  getStateIcon(state) {
    switch (state.toLowerCase()) {
      case "coding":
        return "\u26A1";
      case "reading":
        return "\u{1F4D6}";
      case "debugging":
        return "\u{1F41E}";
      case "terminal":
        return "\u{1F5A5}\uFE0F";
      case "git":
        return "\u{1F9EC}";
      case "testing":
        return "\u{1F9EA}";
      case "ai assisting":
        return "\u{1F916}";
      case "idle":
      default:
        return "\u231B";
    }
  }
  dispose() {
    this.statusBarItem.dispose();
  }
};

// src/commands/index.ts
var vscode9 = __toESM(require("vscode"));

// src/webview/dashboardPanel.ts
var vscode8 = __toESM(require("vscode"));
var path5 = __toESM(require("path"));
var fs2 = __toESM(require("fs"));
var DashboardPanel = class _DashboardPanel {
  static currentPanel;
  static viewType = "devActivityDashboard";
  panel;
  extensionUri;
  dbService;
  tracker;
  disposables = [];
  static createOrShow(extensionUri, dbService, tracker2) {
    const column = vscode8.window.activeTextEditor ? vscode8.window.activeTextEditor.viewColumn : void 0;
    if (_DashboardPanel.currentPanel) {
      _DashboardPanel.currentPanel.panel.reveal(column);
      _DashboardPanel.currentPanel.update();
      return;
    }
    const panel = vscode8.window.createWebviewPanel(
      _DashboardPanel.viewType,
      "Developer Productivity Analytics",
      column || vscode8.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode8.Uri.file(path5.join(extensionUri.fsPath, "src", "views")),
          vscode8.Uri.file(path5.join(extensionUri.fsPath, "dist"))
        ],
        retainContextWhenHidden: true
      }
    );
    _DashboardPanel.currentPanel = new _DashboardPanel(panel, extensionUri, dbService, tracker2);
  }
  constructor(panel, extensionUri, dbService, tracker2) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.dbService = dbService;
    this.tracker = tracker2;
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "getData":
            this.update();
            break;
          case "saveSettings":
            await this.handleSaveSettings(message.config);
            break;
          case "exportData":
            await this.handleExportData(message.range);
            break;
          case "backup":
            this.handleBackup();
            break;
          case "restore":
            await this.handleRestore();
            break;
        }
      },
      null,
      this.disposables
    );
  }
  update() {
    this.panel.webview.postMessage({
      command: "updateData",
      db: this.dbService.getDatabase(),
      config: this.tracker.getActiveState() ? this.getTrackerConfig() : void 0
    });
  }
  getTrackerConfig() {
    const config = vscode8.workspace.getConfiguration("devActivityTracker");
    return {
      idleTimeout: config.get("idleTimeout") || 300,
      dailyGoal: config.get("dailyGoal") || 14400,
      privacyMode: config.get("privacyMode") || false,
      showStatusBar: config.get("showStatusBar") || true
    };
  }
  async handleSaveSettings(config) {
    try {
      const vsConfig = vscode8.workspace.getConfiguration("devActivityTracker");
      await vsConfig.update("idleTimeout", config.idleTimeout, vscode8.ConfigurationTarget.Global);
      await vsConfig.update("dailyGoal", config.dailyGoal, vscode8.ConfigurationTarget.Global);
      await vsConfig.update("privacyMode", config.privacyMode, vscode8.ConfigurationTarget.Global);
      await vsConfig.update("showStatusBar", config.showStatusBar, vscode8.ConfigurationTarget.Global);
      this.tracker.updateConfig();
      vscode8.window.showInformationMessage("Settings saved and applied successfully.");
      this.update();
    } catch (e) {
      vscode8.window.showErrorMessage("Failed to save settings.");
    }
  }
  async handleExportData(range) {
    try {
      const options = {
        defaultUri: vscode8.Uri.file(path5.join(vscode8.workspace.workspaceFolders?.[0]?.uri.fsPath || "", `dev_analytics_export_${Date.now()}.md`)),
        filters: {
          "Markdown (*.md)": ["md"],
          "JSON (*.json)": ["json"],
          "CSV (*.csv)": ["csv"]
        }
      };
      const fileUri = await vscode8.window.showSaveDialog(options);
      if (fileUri) {
        const ext = path5.extname(fileUri.fsPath);
        let content = "";
        if (ext === ".json") {
          content = JSON.stringify(this.dbService.getDatabase(), null, 2);
        } else if (ext === ".csv") {
          content = this.generateCSVContent();
        } else {
          content = this.generateMarkdownContent(range);
        }
        fs2.writeFileSync(fileUri.fsPath, content, "utf8");
        vscode8.window.showInformationMessage(`Data exported successfully to ${path5.basename(fileUri.fsPath)}`);
      }
    } catch (e) {
      vscode8.window.showErrorMessage("Failed to export statistics.");
    }
  }
  generateCSVContent() {
    const db = this.dbService.getDatabase();
    let csv = "Date,Development Time (Seconds),Coding Time (Seconds),Goal (Seconds),Sessions Count,Commits Count,Terminal Time,AI Time\n";
    for (const [date, progress] of Object.entries(db.dailyProgress)) {
      csv += `${date},${progress.developmentTime},${progress.codingTime},${progress.goalSeconds},${progress.sessionsCount},${progress.commitsCount},${progress.terminalTime},${progress.aiTime}
`;
    }
    return csv;
  }
  generateMarkdownContent(range) {
    const db = this.dbService.getDatabase();
    let md = `# Developer Activity Productivity Report

`;
    md += `*Generated on: ${(/* @__PURE__ */ new Date()).toLocaleString()}*
`;
    md += `*Filtered Range: ${range.toUpperCase()}*

`;
    md += `## Daily Performance Summary

`;
    md += `| Date | Dev Time | Coding Time | Goal Completion | Commits | Terminal Time |
`;
    md += `| --- | --- | --- | --- | --- | --- |
`;
    for (const [date, progress] of Object.entries(db.dailyProgress)) {
      const devHours = (progress.developmentTime / 3600).toFixed(1);
      const codingHours = (progress.codingTime / 3600).toFixed(1);
      const pct = Math.round(progress.developmentTime / progress.goalSeconds * 100);
      const termHours = (progress.terminalTime / 3600).toFixed(1);
      md += `| ${date} | ${devHours}h | ${codingHours}h | ${pct}% | ${progress.commitsCount} | ${termHours}h |
`;
    }
    md += `
## Project Contributions

`;
    md += `| Project Name | Total Time Logged | Commits | Edits |
`;
    md += `| --- | --- | --- | --- |
`;
    for (const [name, stats] of Object.entries(db.projects)) {
      const hrs = (stats.totalTime / 3600).toFixed(1);
      md += `| ${name} | ${hrs}h | ${stats.commitsCount} | ${stats.editsCount} |
`;
    }
    return md;
  }
  handleBackup() {
    try {
      const backupPath = this.dbService.backup();
      vscode8.window.showInformationMessage(`Backup created at: ${path5.basename(backupPath)}`);
    } catch (e) {
      vscode8.window.showErrorMessage("Failed to create backup.");
    }
  }
  async handleRestore() {
    try {
      const options = {
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: "Restore Backup",
        filters: {
          "JSON Backup (*.json)": ["json"]
        }
      };
      const fileUris = await vscode8.window.showOpenDialog(options);
      if (fileUris && fileUris.length > 0) {
        const filePath = fileUris[0].fsPath;
        const selection = await vscode8.window.showWarningMessage(
          "Restoring this backup will overwrite all current tracking data. Are you sure you want to proceed?",
          "Yes, Restore",
          "No, Cancel"
        );
        if (selection === "Yes, Restore") {
          this.dbService.restore(filePath);
          vscode8.window.showInformationMessage("Analytics data restored successfully.");
          this.update();
        }
      }
    } catch (e) {
      vscode8.window.showErrorMessage("Failed to restore backup file.");
    }
  }
  getHtmlForWebview(webview) {
    const htmlPath = path5.join(this.extensionUri.fsPath, "src", "views", "dashboard.html");
    let html = fs2.readFileSync(htmlPath, "utf8");
    const cssUri = webview.asWebviewUri(vscode8.Uri.file(
      path5.join(this.extensionUri.fsPath, "src", "views", "dashboard.css")
    ));
    const jsUri = webview.asWebviewUri(vscode8.Uri.file(
      path5.join(this.extensionUri.fsPath, "src", "views", "dashboard.js")
    ));
    html = html.replace('id="style-link" href=""', `id="style-link" href="${cssUri}"`);
    html = html.replace('id="script-link" src=""', `id="script-link" src="${jsUri}"`);
    return html;
  }
  dispose() {
    _DashboardPanel.currentPanel = void 0;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
};

// src/commands/index.ts
var path6 = __toESM(require("path"));
function registerCommands(context, dbService, tracker2) {
  const showDashboard = vscode9.commands.registerCommand(
    "dev-activity-tracker.showDashboard",
    () => {
      DashboardPanel.createOrShow(context.extensionUri, dbService, tracker2);
    }
  );
  const exportData = vscode9.commands.registerCommand(
    "dev-activity-tracker.exportData",
    () => {
      if (DashboardPanel.currentPanel) {
        vscode9.window.showInformationMessage("Triggering export from dashboard...");
      } else {
        DashboardPanel.createOrShow(context.extensionUri, dbService, tracker2);
        vscode9.window.showInformationMessage("Opening dashboard to export statistics.");
      }
    }
  );
  const backupData = vscode9.commands.registerCommand(
    "dev-activity-tracker.backupData",
    () => {
      try {
        const backupPath = dbService.backup();
        vscode9.window.showInformationMessage(`Backup created at: ${path6.basename(backupPath)}`);
      } catch (e) {
        vscode9.window.showErrorMessage("Failed to create backup.");
      }
    }
  );
  const restoreData = vscode9.commands.registerCommand(
    "dev-activity-tracker.restoreData",
    async () => {
      try {
        const options = {
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          openLabel: "Restore Backup",
          filters: {
            "JSON Backup (*.json)": ["json"]
          }
        };
        const fileUris = await vscode9.window.showOpenDialog(options);
        if (fileUris && fileUris.length > 0) {
          const selection = await vscode9.window.showWarningMessage(
            "Restoring this backup will overwrite all current tracking data. Proceed?",
            "Yes",
            "No"
          );
          if (selection === "Yes") {
            dbService.restore(fileUris[0].fsPath);
            vscode9.window.showInformationMessage("Analytics data restored successfully.");
            if (DashboardPanel.currentPanel) {
              DashboardPanel.currentPanel.update();
            }
          }
        }
      } catch (e) {
        vscode9.window.showErrorMessage("Failed to restore backup.");
      }
    }
  );
  context.subscriptions.push(showDashboard, exportData, backupData, restoreData);
}

// src/extension.ts
var tracker;
var statusBarManager;
function activate(context) {
  console.log("Developer Activity & Coding Analytics extension activated.");
  const storagePath = context.globalStorageUri.fsPath;
  const dbService = new DatabaseService(storagePath);
  statusBarManager = new StatusbarManager(dbService);
  tracker = new Tracker(dbService, (state, secondsToday) => {
    if (statusBarManager) {
      statusBarManager.update(state, secondsToday);
    }
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.update();
    }
  });
  registerCommands(context, dbService, tracker);
  statusBarManager.update(tracker.getActiveState(), tracker.getTodayAccumulatedTime());
  context.subscriptions.push(
    vscode10.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("devActivityTracker")) {
        if (tracker) {
          tracker.updateConfig();
        }
      }
    })
  );
}
function deactivate() {
  console.log("Developer Activity & Coding Analytics extension deactivating...");
  if (tracker) {
    tracker.deactivate();
  }
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
