"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
var SessionManager = /** @class */ (function () {
    function SessionManager() {
        this.currentSession = null;
    }
    SessionManager.prototype.startSession = function (workspaceName, workspacePath, repository, branch) {
        var now = Date.now();
        var id = "session_".concat(now, "_").concat(Math.random().toString(36).substring(2, 9));
        this.currentSession = {
            id: id,
            startTime: now,
            endTime: now,
            duration: 0,
            workspaceName: workspaceName,
            workspacePath: workspacePath,
            repository: repository,
            branch: branch,
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
                    description: 'VS Code Session Started',
                    category: 'system'
                }
            ]
        };
        return this.currentSession;
    };
    SessionManager.prototype.getCurrentSession = function () {
        return this.currentSession;
    };
    SessionManager.prototype.updateSessionTimes = function (activeCategory, deltaSeconds) {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.duration += deltaSeconds;
        this.currentSession.endTime = Date.now();
        switch (activeCategory) {
            case 'coding':
                this.currentSession.codingTime += deltaSeconds;
                break;
            case 'reading':
                this.currentSession.readingTime += deltaSeconds;
                break;
            case 'debugging':
                this.currentSession.debuggingTime += deltaSeconds;
                break;
            case 'terminal':
                this.currentSession.terminalTime += deltaSeconds;
                break;
            case 'git':
                this.currentSession.gitTime += deltaSeconds;
                break;
            case 'testing':
                this.currentSession.testingTime += deltaSeconds;
                break;
            case 'ai':
                this.currentSession.aiTime += deltaSeconds;
                break;
        }
    };
    SessionManager.prototype.recordFileActivity = function (relativePath, fileName, languageId, isEdit, deltaSeconds) {
        if (!this.currentSession) {
            return;
        }
        if (!this.currentSession.files[relativePath]) {
            this.currentSession.files[relativePath] = {
                relativePath: relativePath,
                fileName: fileName,
                languageId: languageId,
                timeSpent: 0,
                editsCount: 0,
                readsCount: 0,
                lastActive: Date.now()
            };
        }
        var file = this.currentSession.files[relativePath];
        file.timeSpent += deltaSeconds;
        file.lastActive = Date.now();
        if (isEdit) {
            file.editsCount += 1;
            this.currentSession.editsCount += 1;
        }
        else {
            file.readsCount += 1;
            this.currentSession.readsCount += 1;
        }
        // Accumulate language time
        if (languageId) {
            this.currentSession.languages[languageId] = (this.currentSession.languages[languageId] || 0) + deltaSeconds;
        }
    };
    SessionManager.prototype.recordTerminalCommand = function (command, category) {
        if (!this.currentSession) {
            return;
        }
        var cmdEvent = {
            command: command,
            category: category,
            timestamp: Date.now()
        };
        this.currentSession.terminalCommands.push(cmdEvent);
        this.addTimelineEvent("Executed Terminal Command: ".concat(command.slice(0, 30)).concat(command.length > 30 ? '...' : ''), 'terminal');
    };
    SessionManager.prototype.recordGitCommit = function () {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.gitCommitsCount += 1;
        this.addTimelineEvent('Git Commit Detected', 'git');
    };
    SessionManager.prototype.recordBranchSwitch = function (branch) {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.branch = branch;
        this.addTimelineEvent("Switched Git Branch to ".concat(branch), 'git');
    };
    SessionManager.prototype.recordDebugSessionStart = function () {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.debugSessionsCount += 1;
        this.addTimelineEvent('Debugging Started', 'debugging');
    };
    SessionManager.prototype.recordTestRun = function (success) {
        if (!this.currentSession) {
            return;
        }
        if (success) {
            this.currentSession.testRunsSuccess += 1;
            this.addTimelineEvent('Testing Succeeded', 'testing');
        }
        else {
            this.currentSession.testRunsFailed += 1;
            this.addTimelineEvent('Testing Failed', 'testing');
        }
    };
    SessionManager.prototype.recordAIActivity = function () {
        if (!this.currentSession) {
            return;
        }
        this.addTimelineEvent('AI Assistant Used', 'ai');
    };
    SessionManager.prototype.addTimelineEvent = function (description, category) {
        if (!this.currentSession) {
            return;
        }
        // De-duplicate fast-firing identical timeline events in a short window
        var now = Date.now();
        var lastEvent = this.currentSession.timeline[this.currentSession.timeline.length - 1];
        if (lastEvent && lastEvent.description === description && (now - lastEvent.timestamp < 10000)) {
            return;
        }
        this.currentSession.timeline.push({
            timestamp: now,
            description: description,
            category: category
        });
    };
    SessionManager.prototype.recordTerminalSessionsCount = function (count) {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.terminalSessionsCount = Math.max(this.currentSession.terminalSessionsCount, count);
    };
    SessionManager.prototype.endSession = function () {
        if (!this.currentSession) {
            return null;
        }
        var session = this.currentSession;
        session.endTime = Date.now();
        session.timeline.push({
            timestamp: session.endTime,
            description: 'VS Code Session Ended',
            category: 'system'
        });
        this.currentSession = null;
        return session;
    };
    return SessionManager;
}());
exports.SessionManager = SessionManager;
