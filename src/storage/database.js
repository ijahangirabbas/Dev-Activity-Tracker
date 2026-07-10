"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
var fs = require("fs");
var path = require("path");
var DatabaseService = /** @class */ (function () {
    function DatabaseService(storagePath) {
        this.dbPath = path.join(storagePath, 'db.json');
        this.backupDir = path.join(storagePath, 'backups');
        // Ensure directories exist
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        this.db = this.loadDatabase();
    }
    DatabaseService.prototype.loadDatabase = function () {
        if (fs.existsSync(this.dbPath)) {
            try {
                var raw = fs.readFileSync(this.dbPath, 'utf8');
                var parsed = JSON.parse(raw);
                // Guarantee all properties exist to avoid runtime errors on older db schemas
                return {
                    version: parsed.version || 1,
                    sessions: parsed.sessions || [],
                    projects: parsed.projects || {},
                    dailyProgress: parsed.dailyProgress || {},
                    streaks: parsed.streaks || {
                        coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
                        development: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' }
                    }
                };
            }
            catch (e) {
                console.error('Failed to load database. Attempting recovery from backup...', e);
                return this.recoverFromLatestBackup();
            }
        }
        return this.createDefaultDatabase();
    };
    DatabaseService.prototype.recoverFromLatestBackup = function () {
        try {
            var files = fs.readdirSync(this.backupDir);
            var backupFiles = files
                .filter(function (f) { return f.startsWith('db_backup_') && f.endsWith('.json'); })
                .sort(function (a, b) { return b.localeCompare(a); }); // Latest first
            if (backupFiles.length > 0) {
                var latestBackup = path.join(this.backupDir, backupFiles[0]);
                var raw = fs.readFileSync(latestBackup, 'utf8');
                var db = JSON.parse(raw);
                console.log("Recovered from backup: ".concat(latestBackup));
                return db;
            }
        }
        catch (e) {
            console.error('Backup recovery failed:', e);
        }
        return this.createDefaultDatabase();
    };
    DatabaseService.prototype.createDefaultDatabase = function () {
        return {
            version: 1,
            sessions: [],
            projects: {},
            dailyProgress: {},
            streaks: {
                coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
                development: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' }
            }
        };
    };
    DatabaseService.prototype.save = function () {
        try {
            var tempPath = this.dbPath + '.tmp';
            var data = JSON.stringify(this.db, null, 2);
            fs.writeFileSync(tempPath, data, 'utf8');
            fs.renameSync(tempPath, this.dbPath);
        }
        catch (e) {
            console.error('Error saving database atomically:', e);
        }
    };
    DatabaseService.prototype.getDatabase = function () {
        this.db = this.loadDatabase();
        return this.db;
    };
    DatabaseService.prototype.addSession = function (session, dailyGoalSeconds) {
        // Reload database from disk to incorporate changes from other windows
        this.db = this.loadDatabase();
        // Add session to history
        this.db.sessions.push(session);
        // Update aggregates
        this.updateProjectStats(session);
        this.updateDailyProgress(session, dailyGoalSeconds);
        this.updateStreaks(session);
        this.save();
        // Occasional auto-backup (10% chance when adding session)
        if (Math.random() < 0.1) {
            this.backup();
        }
    };
    DatabaseService.prototype.updateProjectStats = function (session) {
        var projName = session.workspaceName || 'Unknown Project';
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
        var p = this.db.projects[projName];
        p.totalTime += session.duration;
        p.editsCount += session.editsCount;
        p.readsCount += session.readsCount;
        p.commitsCount += session.gitCommitsCount;
        p.terminalTime += session.terminalTime;
        p.aiTime += session.aiTime;
        if (session.branch && !p.branches.includes(session.branch)) {
            p.branches.push(session.branch);
        }
        // Merge languages
        for (var _i = 0, _a = Object.entries(session.languages); _i < _a.length; _i++) {
            var _b = _a[_i], lang = _b[0], sec = _b[1];
            p.languages[lang] = (p.languages[lang] || 0) + sec;
        }
        // Merge files
        for (var _c = 0, _d = Object.entries(session.files); _c < _d.length; _c++) {
            var _e = _d[_c], file = _e[0], stats = _e[1];
            p.files[file] = (p.files[file] || 0) + stats.timeSpent;
        }
        // Update time intervals (simple recalculation from sessions for accuracy)
        this.recalculateProjectIntervalTimes(projName);
    };
    DatabaseService.prototype.recalculateProjectIntervalTimes = function (projName) {
        var p = this.db.projects[projName];
        if (!p) {
            return;
        }
        var now = Date.now();
        var oneDay = 24 * 60 * 60 * 1000;
        p.todayTime = 0;
        p.weeklyTime = 0;
        p.monthlyTime = 0;
        var todayStr = this.formatDate(new Date(now));
        var startOfWeek = now - 7 * oneDay;
        var startOfMonth = now - 30 * oneDay;
        for (var _i = 0, _a = this.db.sessions; _i < _a.length; _i++) {
            var s = _a[_i];
            if (s.workspaceName !== projName) {
                continue;
            }
            var sDate = this.formatDate(new Date(s.startTime));
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
    };
    DatabaseService.prototype.updateDailyProgress = function (session, dailyGoalSeconds) {
        var dateStr = this.formatDate(new Date(session.startTime));
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
        var dp = this.db.dailyProgress[dateStr];
        dp.codingTime += session.codingTime;
        dp.developmentTime += session.duration;
        dp.sessionsCount += 1;
        dp.commitsCount += session.gitCommitsCount;
        dp.terminalTime += session.terminalTime;
        dp.aiTime += session.aiTime;
        var projName = session.workspaceName || 'Unknown Project';
        dp.projects[projName] = (dp.projects[projName] || 0) + session.duration;
        for (var _i = 0, _a = Object.entries(session.languages); _i < _a.length; _i++) {
            var _b = _a[_i], lang = _b[0], sec = _b[1];
            dp.languages[lang] = (dp.languages[lang] || 0) + sec;
        }
        dp.isCompleted = dp.developmentTime >= dp.goalSeconds;
    };
    DatabaseService.prototype.updateStreaks = function (session) {
        var todayStr = this.formatDate(new Date(session.startTime));
        // Update coding streak if coding happened
        if (session.codingTime > 0) {
            this.db.streaks.coding = this.calculateStreak(this.db.streaks.coding, todayStr);
        }
        // Update development streak
        this.db.streaks.development = this.calculateStreak(this.db.streaks.development, todayStr);
    };
    DatabaseService.prototype.calculateStreak = function (streak, todayStr) {
        var lastActive = streak.lastActiveDate;
        if (lastActive === todayStr) {
            // Already active today, streak is same
            return streak;
        }
        if (lastActive === '') {
            // First activity
            return {
                currentStreak: 1,
                longestStreak: 1,
                lastActiveDate: todayStr
            };
        }
        var lastDate = new Date(lastActive);
        var todayDate = new Date(todayStr);
        // Get difference in days
        var diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        var newCurrent = streak.currentStreak;
        if (diffDays === 1) {
            newCurrent += 1;
        }
        else if (diffDays > 1) {
            newCurrent = 1;
        }
        var newLongest = Math.max(streak.longestStreak, newCurrent);
        return {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastActiveDate: todayStr
        };
    };
    // Multi-window session tracking coordination
    DatabaseService.prototype.writeActiveSession = function (windowId, session) {
        try {
            var activeSessionsDir = path.join(path.dirname(this.dbPath), 'active_sessions');
            if (!fs.existsSync(activeSessionsDir)) {
                fs.mkdirSync(activeSessionsDir, { recursive: true });
            }
            var filePath = path.join(activeSessionsDir, "".concat(windowId, ".json"));
            fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
        }
        catch (e) {
            console.error("Failed to write active session for ".concat(windowId, ":"), e);
        }
    };
    DatabaseService.prototype.deleteActiveSession = function (windowId) {
        try {
            var activeSessionsDir = path.join(path.dirname(this.dbPath), 'active_sessions');
            var filePath = path.join(activeSessionsDir, "".concat(windowId, ".json"));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (e) {
            // Ignore
        }
    };
    DatabaseService.prototype.getActiveSessions = function () {
        var activeSessions = [];
        try {
            var activeSessionsDir = path.join(path.dirname(this.dbPath), 'active_sessions');
            if (fs.existsSync(activeSessionsDir)) {
                var files = fs.readdirSync(activeSessionsDir);
                var now = Date.now();
                for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                    var file = files_1[_i];
                    if (file.endsWith('.json')) {
                        var filePath = path.join(activeSessionsDir, file);
                        try {
                            var stat = fs.statSync(filePath);
                            // Exclude files that haven't been updated in the last 15 seconds (dead processes/crashes)
                            if (now - stat.mtimeMs < 15000) {
                                var raw = fs.readFileSync(filePath, 'utf8');
                                activeSessions.push(JSON.parse(raw));
                            }
                        }
                        catch (e) {
                            // Ignore individual read errors
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('Failed to get active sessions:', e);
        }
        return activeSessions;
    };
    DatabaseService.prototype.getMergedLiveDatabase = function (activeSessions, dailyGoal) {
        // Avoid modifying the original database object
        var mergedDb = JSON.parse(JSON.stringify(this.getDatabase()));
        // Sort active sessions chronologically
        activeSessions.sort(function (a, b) { return a.startTime - b.startTime; });
        var _loop_1 = function (session) {
            if (mergedDb.sessions.some(function (s) { return s.id === session.id; })) {
                return "continue";
            }
            mergedDb.sessions.push(session);
            // Update project statistics
            var projName = session.workspaceName || 'Unknown Project';
            if (!mergedDb.projects[projName]) {
                mergedDb.projects[projName] = {
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
            var p = mergedDb.projects[projName];
            p.totalTime += session.duration;
            p.editsCount += (session.editsCount || 0);
            p.readsCount += (session.readsCount || 0);
            p.commitsCount += (session.gitCommitsCount || 0);
            p.terminalTime += (session.terminalTime || 0);
            p.aiTime += (session.aiTime || 0);
            if (session.branch && !p.branches.includes(session.branch)) {
                p.branches.push(session.branch);
            }
            for (var _e = 0, _f = Object.entries(session.languages || {}); _e < _f.length; _e++) {
                var _g = _f[_e], lang = _g[0], sec = _g[1];
                p.languages[lang] = (p.languages[lang] || 0) + sec;
            }
            for (var _h = 0, _j = Object.entries(session.files || {}); _h < _j.length; _h++) {
                var _k = _j[_h], file = _k[0], stats = _k[1];
                var fileTime = stats.timeSpent || 0;
                p.files[file] = (p.files[file] || 0) + fileTime;
            }
            // Update daily progress
            var sessionDate = new Date(session.startTime);
            var dateStr = "".concat(sessionDate.getFullYear(), "-").concat(String(sessionDate.getMonth() + 1).padStart(2, '0'), "-").concat(String(sessionDate.getDate()).padStart(2, '0'));
            if (!mergedDb.dailyProgress[dateStr]) {
                mergedDb.dailyProgress[dateStr] = {
                    date: dateStr,
                    codingTime: 0,
                    developmentTime: 0,
                    goalSeconds: dailyGoal,
                    isCompleted: false,
                    sessionsCount: 0,
                    commitsCount: 0,
                    terminalTime: 0,
                    aiTime: 0,
                    projects: {},
                    languages: {}
                };
            }
            var dp = mergedDb.dailyProgress[dateStr];
            dp.codingTime += (session.codingTime || 0);
            dp.developmentTime += session.duration;
            dp.sessionsCount += 1;
            dp.commitsCount += (session.gitCommitsCount || 0);
            dp.terminalTime += (session.terminalTime || 0);
            dp.aiTime += (session.aiTime || 0);
            dp.projects[projName] = (dp.projects[projName] || 0) + session.duration;
            for (var _l = 0, _m = Object.entries(session.languages || {}); _l < _m.length; _l++) {
                var _o = _m[_l], lang = _o[0], sec = _o[1];
                dp.languages[lang] = (dp.languages[lang] || 0) + sec;
            }
            dp.isCompleted = dp.developmentTime >= dp.goalSeconds;
        };
        for (var _i = 0, activeSessions_1 = activeSessions; _i < activeSessions_1.length; _i++) {
            var session = activeSessions_1[_i];
            _loop_1(session);
        }
        // Recalculate project interval times on the final merged session set
        for (var _a = 0, _b = Object.keys(mergedDb.projects); _a < _b.length; _a++) {
            var projName = _b[_a];
            var now = Date.now();
            var oneDay = 24 * 60 * 60 * 1000;
            var todayStr = "".concat(new Date(now).getFullYear(), "-").concat(String(new Date(now).getMonth() + 1).padStart(2, '0'), "-").concat(String(new Date(now).getDate()).padStart(2, '0'));
            var startOfWeek = now - 7 * oneDay;
            var startOfMonth = now - 30 * oneDay;
            var p = mergedDb.projects[projName];
            p.todayTime = 0;
            p.weeklyTime = 0;
            p.monthlyTime = 0;
            for (var _c = 0, _d = mergedDb.sessions; _c < _d.length; _c++) {
                var s = _d[_c];
                if (s.workspaceName !== projName) {
                    continue;
                }
                var sDate = "".concat(new Date(s.startTime).getFullYear(), "-").concat(String(new Date(s.startTime).getMonth() + 1).padStart(2, '0'), "-").concat(String(new Date(s.startTime).getDate()).padStart(2, '0'));
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
        return mergedDb;
    };
    // Backup methods
    DatabaseService.prototype.backup = function () {
        var _this = this;
        try {
            var dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            var backupPath = path.join(this.backupDir, "db_backup_".concat(dateStr, "_").concat(Date.now(), ".json"));
            fs.writeFileSync(backupPath, JSON.stringify(this.db, null, 2), 'utf8');
            // Clean up backups, keeping only the 5 most recent
            var files = fs.readdirSync(this.backupDir)
                .filter(function (f) { return f.startsWith('db_backup_') && f.endsWith('.json'); })
                .map(function (f) { return path.join(_this.backupDir, f); });
            if (files.length > 5) {
                // Sort oldest first and delete
                files.sort(function (a, b) { return fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs; });
                var toDelete = files.slice(0, files.length - 5);
                for (var _i = 0, toDelete_1 = toDelete; _i < toDelete_1.length; _i++) {
                    var f = toDelete_1[_i];
                    fs.unlinkSync(f);
                }
            }
            return backupPath;
        }
        catch (e) {
            console.error('Backup failed:', e);
            throw e;
        }
    };
    DatabaseService.prototype.restore = function (backupPath) {
        try {
            var raw = fs.readFileSync(backupPath, 'utf8');
            var backupDb = JSON.parse(raw);
            if (backupDb.version && Array.isArray(backupDb.sessions)) {
                this.db = backupDb;
                this.save();
            }
            else {
                throw new Error('Invalid database format');
            }
        }
        catch (e) {
            console.error('Restore failed:', e);
            throw e;
        }
    };
    DatabaseService.prototype.merge = function (mergePath) {
        try {
            // Reload database from disk to incorporate changes from other windows
            this.db = this.loadDatabase();
            var raw = fs.readFileSync(mergePath, 'utf8');
            var mergeDb = JSON.parse(raw);
            if (!mergeDb.version || !Array.isArray(mergeDb.sessions)) {
                throw new Error('Invalid merge file format');
            }
            // Merge sessions using ID as unique identifier
            var currentSessionIds = new Set(this.db.sessions.map(function (s) { return s.id; }));
            for (var _i = 0, _a = mergeDb.sessions; _i < _a.length; _i++) {
                var s = _a[_i];
                if (!currentSessionIds.has(s.id)) {
                    this.db.sessions.push(s);
                }
            }
            // Rebuild projects, dailyProgress, streaks from merged sessions
            this.rebuildAllStats();
            this.save();
        }
        catch (e) {
            console.error('Merge failed:', e);
            throw e;
        }
    };
    DatabaseService.prototype.rebuildAllStats = function () {
        this.db.projects = {};
        this.db.dailyProgress = {};
        this.db.streaks = {
            coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
            development: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' }
        };
        // Sort sessions chronologically
        this.db.sessions.sort(function (a, b) { return a.startTime - b.startTime; });
        for (var _i = 0, _a = this.db.sessions; _i < _a.length; _i++) {
            var s = _a[_i];
            this.updateProjectStats(s);
            this.updateDailyProgress(s, 14400); // use default goal
            this.updateStreaks(s);
        }
    };
    DatabaseService.prototype.formatDate = function (d) {
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return "".concat(year, "-").concat(month, "-").concat(day);
    };
    return DatabaseService;
}());
exports.DatabaseService = DatabaseService;
