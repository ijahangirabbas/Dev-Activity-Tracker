import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSchema, DevSession, StreakStats } from '../models/types';

export class DatabaseService {
  private dbPath: string;
  private backupDir: string;
  private db: DatabaseSchema;

  constructor(storagePath: string) {
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

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
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
      } catch (e) {
        console.error('Failed to load database. Attempting recovery from backup...', e);
        return this.recoverFromLatestBackup();
      }
    }
    return this.createDefaultDatabase();
  }

  private recoverFromLatestBackup(): DatabaseSchema {
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
    } catch (e) {
      console.error('Backup recovery failed:', e);
    }
    return this.createDefaultDatabase();
  }

  private createDefaultDatabase(): DatabaseSchema {
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

  public save(): void {
    try {
      const tempPath = this.dbPath + '.tmp';
      const data = JSON.stringify(this.db, null, 2);
      fs.writeFileSync(tempPath, data, 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (e) {
      console.error('Error saving database atomically:', e);
    }
  }

  public getDatabase(): DatabaseSchema {
    this.db = this.loadDatabase();
    return this.db;
  }

  public addSession(session: DevSession, dailyGoalSeconds: number): void {
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
  }

  private updateProjectStats(session: DevSession): void {
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

  private recalculateProjectIntervalTimes(projName: string): void {
    const p = this.db.projects[projName];
    if (!p) { return; }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    p.todayTime = 0;
    p.weeklyTime = 0;
    p.monthlyTime = 0;

    const todayStr = this.formatDate(new Date(now));
    const startOfWeek = now - 7 * oneDay;
    const startOfMonth = now - 30 * oneDay;

    for (const s of this.db.sessions) {
      if (s.workspaceName !== projName) { continue; }
      
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

  private updateDailyProgress(session: DevSession, dailyGoalSeconds: number): void {
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

  private updateStreaks(session: DevSession): void {
    const todayStr = this.formatDate(new Date(session.startTime));
    
    // Update coding streak if coding happened
    if (session.codingTime > 0) {
      this.db.streaks.coding = this.calculateStreak(this.db.streaks.coding, todayStr);
    }
    
    // Update development streak
    this.db.streaks.development = this.calculateStreak(this.db.streaks.development, todayStr);
  }

  private calculateStreak(streak: StreakStats, todayStr: string): StreakStats {
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

  // Multi-window session tracking coordination
  public writeActiveSession(windowId: string, session: any): void {
    try {
      const activeSessionsDir = path.join(path.dirname(this.dbPath), 'active_sessions');
      if (!fs.existsSync(activeSessionsDir)) {
        fs.mkdirSync(activeSessionsDir, { recursive: true });
      }
      const filePath = path.join(activeSessionsDir, `${windowId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
    } catch (e) {
      console.error(`Failed to write active session for ${windowId}:`, e);
    }
  }

  public deleteActiveSession(windowId: string): void {
    try {
      const activeSessionsDir = path.join(path.dirname(this.dbPath), 'active_sessions');
      const filePath = path.join(activeSessionsDir, `${windowId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // Ignore
    }
  }

  public getActiveSessions(): any[] {
    const activeSessions: any[] = [];
    try {
      const activeSessionsDir = path.join(path.dirname(this.dbPath), 'active_sessions');
      if (fs.existsSync(activeSessionsDir)) {
        const files = fs.readdirSync(activeSessionsDir);
        const now = Date.now();
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(activeSessionsDir, file);
            try {
              const stat = fs.statSync(filePath);
              // Exclude files that haven't been updated in the last 15 seconds (dead processes/crashes)
              if (now - stat.mtimeMs < 15000) {
                const raw = fs.readFileSync(filePath, 'utf8');
                activeSessions.push(JSON.parse(raw));
              }
            } catch (e) {
              // Ignore individual read errors
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to get active sessions:', e);
    }
    return activeSessions;
  }

  public getMergedLiveDatabase(activeSessions: any[], dailyGoal: number): DatabaseSchema {
    // Avoid modifying the original database object
    const mergedDb = JSON.parse(JSON.stringify(this.getDatabase()));
    
    // Sort active sessions chronologically
    activeSessions.sort((a, b) => a.startTime - b.startTime);

    for (const session of activeSessions) {
      if (mergedDb.sessions.some((s: any) => s.id === session.id)) {
        continue;
      }
      
      mergedDb.sessions.push(session);

      // Update project statistics
      const projName = session.workspaceName || 'Unknown Project';
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
      
      const p = mergedDb.projects[projName];
      p.totalTime += session.duration;
      p.editsCount += (session.editsCount || 0);
      p.readsCount += (session.readsCount || 0);
      p.commitsCount += (session.gitCommitsCount || 0);
      p.terminalTime += (session.terminalTime || 0);
      p.aiTime += (session.aiTime || 0);
      
      if (session.branch && !p.branches.includes(session.branch)) {
        p.branches.push(session.branch);
      }
      
      for (const [lang, sec] of Object.entries(session.languages || {})) {
        p.languages[lang] = (p.languages[lang] || 0) + (sec as number);
      }
      
      for (const [file, stats] of Object.entries(session.files || {})) {
        const fileTime = (stats as any).timeSpent || 0;
        p.files[file] = (p.files[file] || 0) + fileTime;
      }

      // Update daily progress
      const sessionDate = new Date(session.startTime);
      const dateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
      
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
      
      const dp = mergedDb.dailyProgress[dateStr];
      dp.codingTime += (session.codingTime || 0);
      dp.developmentTime += session.duration;
      dp.sessionsCount += 1;
      dp.commitsCount += (session.gitCommitsCount || 0);
      dp.terminalTime += (session.terminalTime || 0);
      dp.aiTime += (session.aiTime || 0);
      dp.projects[projName] = (dp.projects[projName] || 0) + session.duration;
      
      for (const [lang, sec] of Object.entries(session.languages || {})) {
        dp.languages[lang] = (dp.languages[lang] || 0) + (sec as number);
      }
      
      dp.isCompleted = dp.developmentTime >= dp.goalSeconds;
    }
    
    // Recalculate project interval times on the final merged session set
    for (const projName of Object.keys(mergedDb.projects)) {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const todayStr = `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, '0')}-${String(new Date(now).getDate()).padStart(2, '0')}`;
      const startOfWeek = now - 7 * oneDay;
      const startOfMonth = now - 30 * oneDay;
      
      const p = mergedDb.projects[projName];
      p.todayTime = 0;
      p.weeklyTime = 0;
      p.monthlyTime = 0;
      
      for (const s of mergedDb.sessions) {
        if (s.workspaceName !== projName) { continue; }
        const sDate = `${new Date(s.startTime).getFullYear()}-${String(new Date(s.startTime).getMonth() + 1).padStart(2, '0')}-${String(new Date(s.startTime).getDate()).padStart(2, '0')}`;
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
  }

  public getLiveStreak(streak: StreakStats): number {
    if (!streak || !streak.lastActiveDate) { return 0; }
    
    const todayStr = this.formatDate(new Date());
    if (streak.lastActiveDate === todayStr) {
      return streak.currentStreak;
    }
    
    const lastDate = new Date(streak.lastActiveDate);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return streak.currentStreak;
    }
    return 0;
  }

  // Backup methods
  public backup(): string {
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
    } catch (e) {
      console.error('Backup failed:', e);
      throw e;
    }
  }

  public reSanitizeHistory(privacyMode: boolean, recordRaw: boolean): string {
    const backupPath = this.backup();

    this.db.sessions = this.db.sessions.map(session => {
      // 1. Obfuscate session fields under privacy mode
      let workspaceName = session.workspaceName;
      let workspacePathVal = session.workspacePath;
      let repository = session.repository;
      let branch = session.branch;

      if (privacyMode) {
        if (workspaceName && workspaceName !== 'No Workspace') {
          workspaceName = `Project_${this.simpleHash(workspaceName)}`;
        }
        if (workspacePathVal) {
          workspacePathVal = `C:\\private\\Project_${this.simpleHash(workspaceName)}`;
        }
        if (repository) {
          repository = `repo_${this.simpleHash(repository)}`;
        }
        if (branch) {
          branch = `branch_${this.simpleHash(branch)}`;
        }
      }

      // 2. Obfuscate files under privacy mode
      let files = session.files;
      if (privacyMode && files) {
        const newFiles: Record<string, any> = {};
        for (const [relPath, stats] of Object.entries(files)) {
          const parts = relPath.split(/[/\\]/);
          const obscuredParts = parts.map((part, index) => {
            if (index === parts.length - 1) {
              const ext = path.extname(part);
              const nameWithoutExt = path.basename(part, ext);
              return `file_${this.simpleHash(nameWithoutExt)}${ext}`;
            }
            return `dir_${this.simpleHash(part)}`;
          });
          const newRelPath = obscuredParts.join('/');
          const newFileName = obscuredParts[obscuredParts.length - 1];
          
          newFiles[newRelPath] = {
            ...stats,
            fileName: newFileName,
            relativePath: newRelPath
          };
        }
        files = newFiles;
      }

      // 3. Obfuscate terminal commands
      let terminalCommands = session.terminalCommands;
      if (terminalCommands) {
        terminalCommands = terminalCommands.map(cmd => {
          let cleanCmd = this.redactSecrets(cmd.command);
          if (!recordRaw || privacyMode) {
            cleanCmd = `[${cmd.category || 'command'}]`;
          }
          return {
            ...cmd,
            command: cleanCmd
          };
        });
      }

      // 4. Obfuscate timeline descriptions
      let timeline = session.timeline;
      if (timeline) {
        timeline = timeline.map(evt => {
          let desc = evt.description;
          if (privacyMode) {
            if (desc.startsWith('Saved file: ')) {
              const filePart = desc.substring(12);
              const ext = path.extname(filePart);
              const base = path.basename(filePart, ext);
              desc = `Saved file: file_${this.simpleHash(base)}${ext}`;
            } else if (desc.startsWith('Opened file: ')) {
              const filePart = desc.substring(13);
              const ext = path.extname(filePart);
              const base = path.basename(filePart, ext);
              desc = `Opened file: file_${this.simpleHash(base)}${ext}`;
            } else if (desc.startsWith('Switched Git Branch to ')) {
              const branchPart = desc.substring(23);
              desc = `Switched Git Branch to branch_${this.simpleHash(branchPart)}`;
            } else if (desc.startsWith('Executed Terminal Command: ')) {
              desc = `Executed Terminal Command: [terminal]`;
            }
          } else {
            if (desc.startsWith('Executed Terminal Command: ')) {
              const cmdPart = desc.substring(27);
              desc = `Executed Terminal Command: ${this.redactSecrets(cmdPart).slice(0, 30)}`;
            }
          }
          return {
            ...evt,
            description: desc
          };
        });
      }

      return {
        ...session,
        workspaceName,
        workspacePath: workspacePathVal,
        repository,
        branch,
        files,
        terminalCommands,
        timeline
      };
    });

    // Rebuild everything and save
    this.rebuildAllStats();
    this.save();

    return backupPath;
  }

  private redactSecrets(command: string): string {
    let redacted = command.replace(/(token|pass|password|api_key|key|secret|credential|pwd)\s*=\s*[^\s"']+/gi, '$1=[REDACTED]');
    redacted = redacted.replace(/(token|pass|password|api_key|key|secret|credential|pwd)\s*=\s*(["'])(.*?)\2/gi, '$1=$2[REDACTED]$2');
    
    redacted = redacted.replace(/(-\w*p|--password|--token|--api-key|--secret|--key)\s+[^\s"']+/gi, '$1 [REDACTED]');
    redacted = redacted.replace(/(-\w*p|--password|--token|--api-key|--secret|--key)\s+(["'])(.*?)\2/gi, '$1 $2[REDACTED]$2');
    
    return redacted;
  }

  private simpleHash(str: string): string {
    if (!str) return '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
  }

  public restore(backupPath: string): void {
    try {
      const raw = fs.readFileSync(backupPath, 'utf8');
      const backupDb = JSON.parse(raw);
      
      if (backupDb.version && Array.isArray(backupDb.sessions)) {
        this.db = backupDb;
        this.save();
      } else {
        throw new Error('Invalid database format');
      }
    } catch (e) {
      console.error('Restore failed:', e);
      throw e;
    }
  }

  public merge(mergePath: string): void {
    try {
      // Reload database from disk to incorporate changes from other windows
      this.db = this.loadDatabase();

      const raw = fs.readFileSync(mergePath, 'utf8');
      const mergeDb = JSON.parse(raw) as DatabaseSchema;
      
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
    } catch (e) {
      console.error('Merge failed:', e);
      throw e;
    }
  }

  private rebuildAllStats(): void {
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

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
