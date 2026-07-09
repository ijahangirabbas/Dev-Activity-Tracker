"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DatabaseService {
    dbPath;
    backupDir;
    db;
    constructor(storagePath) {
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
    loadDatabase() {
        if (fs.existsSync(this.dbPath)) {
            try {
                const raw = fs.readFileSync(this.dbPath, 'utf8');
                return JSON.parse(raw);
            }
            catch (e) {
                console.error('Failed to load database. Attempting recovery from backup...', e);
                return this.recoverFromLatestBackup();
            }
        }
        return this.createDefaultDatabase();
    }
    recoverFromLatestBackup() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backupFiles = files
                .filter(f => f.startsWith('db_backup_') && f.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)); // Latest first
            if (backupFiles.length > 0) {
                const latestBackup = path.join(this.backupDir, backupFiles[0]);
                const raw = fs.readFileSync(latestBackup, 'utf8');
                const db = JSON.parse(raw);
                console.log(`Recovered from backup: ${latestBackup}`);
                return db;
            }
        }
        catch (e) {
            console.error('Backup recovery failed:', e);
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
                coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
                development: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' }
            }
        };
    }
    save() {
        try {
            const tempPath = this.dbPath + '.tmp';
            const data = JSON.stringify(this.db, null, 2);
            fs.writeFileSync(tempPath, data, 'utf8');
            fs.renameSync(tempPath, this.dbPath);
        }
        catch (e) {
            console.error('Error saving database atomically:', e);
        }
    }
    getDatabase() {
        return this.db;
    }
    addSession(session, dailyGoalSeconds) {
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
    }
    updateProjectStats(session) {
        const projName = session.workspaceName || 'Unknown Project';
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
        // Merge languages
        for (const [lang, sec] of Object.entries(session.languages)) {
            p.languages[lang] = (p.languages[lang] || 0) + sec;
        }
        // Merge files
        for (const [file, stats] of Object.entries(session.files)) {
            p.files[file] = (p.files[file] || 0) + stats.timeSpent;
        }
        // Update time intervals (simple recalculation from sessions for accuracy)
        this.recalculateProjectIntervalTimes(projName);
    }
    recalculateProjectIntervalTimes(projName) {
        const p = this.db.projects[projName];
        if (!p) {
            return;
        }
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
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
        const projName = session.workspaceName || 'Unknown Project';
        dp.projects[projName] = (dp.projects[projName] || 0) + session.duration;
        for (const [lang, sec] of Object.entries(session.languages)) {
            dp.languages[lang] = (dp.languages[lang] || 0) + sec;
        }
        dp.isCompleted = dp.developmentTime >= dp.goalSeconds;
    }
    updateStreaks(session) {
        const todayStr = this.formatDate(new Date(session.startTime));
        // Update coding streak if coding happened
        if (session.codingTime > 0) {
            this.db.streaks.coding = this.calculateStreak(this.db.streaks.coding, todayStr);
        }
        // Update development streak
        this.db.streaks.development = this.calculateStreak(this.db.streaks.development, todayStr);
    }
    calculateStreak(streak, todayStr) {
        const lastActive = streak.lastActiveDate;
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
        const lastDate = new Date(lastActive);
        const todayDate = new Date(todayStr);
        // Get difference in days
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let newCurrent = streak.currentStreak;
        if (diffDays === 1) {
            newCurrent += 1;
        }
        else if (diffDays > 1) {
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
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const backupPath = path.join(this.backupDir, `db_backup_${dateStr}_${Date.now()}.json`);
            fs.writeFileSync(backupPath, JSON.stringify(this.db, null, 2), 'utf8');
            // Clean up backups, keeping only the 5 most recent
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('db_backup_') && f.endsWith('.json'))
                .map(f => path.join(this.backupDir, f));
            if (files.length > 5) {
                // Sort oldest first and delete
                files.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
                const toDelete = files.slice(0, files.length - 5);
                for (const f of toDelete) {
                    fs.unlinkSync(f);
                }
            }
            return backupPath;
        }
        catch (e) {
            console.error('Backup failed:', e);
            throw e;
        }
    }
    restore(backupPath) {
        try {
            const raw = fs.readFileSync(backupPath, 'utf8');
            const backupDb = JSON.parse(raw);
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
    }
    merge(mergePath) {
        try {
            const raw = fs.readFileSync(mergePath, 'utf8');
            const mergeDb = JSON.parse(raw);
            if (!mergeDb.version || !Array.isArray(mergeDb.sessions)) {
                throw new Error('Invalid merge file format');
            }
            // Merge sessions using ID as unique identifier
            const currentSessionIds = new Set(this.db.sessions.map(s => s.id));
            for (const s of mergeDb.sessions) {
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
    }
    rebuildAllStats() {
        this.db.projects = {};
        this.db.dailyProgress = {};
        this.db.streaks = {
            coding: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
            development: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' }
        };
        // Sort sessions chronologically
        this.db.sessions.sort((a, b) => a.startTime - b.startTime);
        for (const s of this.db.sessions) {
            this.updateProjectStats(s);
            this.updateDailyProgress(s, 14400); // use default goal
            this.updateStreaks(s);
        }
    }
    formatDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
exports.DatabaseService = DatabaseService;
