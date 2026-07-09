"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
class SessionManager {
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
                    description: 'VS Code Session Started',
                    category: 'system'
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
        }
        else {
            file.readsCount += 1;
            this.currentSession.readsCount += 1;
        }
        // Accumulate language time
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
        this.addTimelineEvent(`Executed Terminal Command: ${command.slice(0, 30)}${command.length > 30 ? '...' : ''}`, 'terminal');
    }
    recordGitCommit() {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.gitCommitsCount += 1;
        this.addTimelineEvent('Git Commit Detected', 'git');
    }
    recordBranchSwitch(branch) {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.branch = branch;
        this.addTimelineEvent(`Switched Git Branch to ${branch}`, 'git');
    }
    recordDebugSessionStart() {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.debugSessionsCount += 1;
        this.addTimelineEvent('Debugging Started', 'debugging');
    }
    recordTestRun(success) {
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
    }
    recordAIActivity() {
        if (!this.currentSession) {
            return;
        }
        this.addTimelineEvent('AI Assistant Used', 'ai');
    }
    addTimelineEvent(description, category) {
        if (!this.currentSession) {
            return;
        }
        // De-duplicate fast-firing identical timeline events in a short window
        const now = Date.now();
        const lastEvent = this.currentSession.timeline[this.currentSession.timeline.length - 1];
        if (lastEvent && lastEvent.description === description && (now - lastEvent.timestamp < 10000)) {
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
            description: 'VS Code Session Ended',
            category: 'system'
        });
        this.currentSession = null;
        return session;
    }
}
exports.SessionManager = SessionManager;
