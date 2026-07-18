import { apiClient } from './api';
import { supabase } from './supabase';
import { DevSession } from '../types';

export interface SyncResult {
  success: boolean;
  syncedSessionsCount: number;
  error?: string;
}

export async function syncLocalDataToCloud(localDb: any, privacyMode: boolean = false): Promise<SyncResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) {
    return { success: false, syncedSessionsCount: 0, error: 'User not authenticated' };
  }

  const userId = session.user.id;

  try {
    // 1. Fetch existing sessions to determine what needs to be synced
    const { data: existingSessions } = await apiClient.get<DevSession[]>('/dev_sessions?select=id');
    const existingIds = new Set((existingSessions || []).map((s: any) => s.id));

    // 2. Filter local sessions that are missing in Supabase
    const localSessions = localDb.sessions || [];
    const sessionsToSync = localSessions.filter((s: any) => s.id && !existingIds.has(s.id));

    if (sessionsToSync.length > 0) {
      const rows = sessionsToSync.map((s: any) => {
        let workspaceName = s.workspaceName || '';
        let workspacePath = s.workspacePath || '';
        let repository = s.repository || '';
        let branch = s.branch || '';

        if (privacyMode) {
          if (workspaceName && workspaceName !== 'No Workspace') {
            workspaceName = `Project_${simpleHash(workspaceName)}`;
          }
          if (workspacePath) {
            workspacePath = `C:\\private\\Project_${simpleHash(workspaceName)}`;
          }
          if (repository) {
            repository = `repo_${simpleHash(repository)}`;
          }
          if (branch) {
            branch = `branch_${simpleHash(branch)}`;
          }
        }

        // Mask files
        let files = s.files || {};
        if (privacyMode && files) {
          const newFiles: Record<string, any> = {};
          for (const [relPath, stats] of Object.entries(files)) {
            const parts = relPath.split(/[/\\]/);
            const obscuredParts = parts.map((part, index) => {
              if (index === parts.length - 1) {
                const ext = part.includes('.') ? part.substring(part.lastIndexOf('.')) : '';
                const nameWithoutExt = ext ? part.substring(0, part.lastIndexOf('.')) : part;
                return `file_${simpleHash(nameWithoutExt)}${ext}`;
              }
              return `dir_${simpleHash(part)}`;
            });
            const newRelPath = obscuredParts.join('/');
            const newFileName = obscuredParts[obscuredParts.length - 1];
            
            newFiles[newRelPath] = {
              ...(stats as any),
              fileName: newFileName,
              relativePath: newRelPath
            };
          }
          files = newFiles;
        }

        // Mask terminal commands
        let terminalCommands = s.terminalCommands || [];
        if (terminalCommands) {
          terminalCommands = terminalCommands.map((cmd: any) => {
            let cleanCmd = redactSecrets(cmd.command);
            if (privacyMode) {
              cleanCmd = `[${cmd.category || 'command'}]`;
            }
            return {
              ...cmd,
              command: cleanCmd
            };
          });
        }

        // Mask timeline
        let timeline = s.timeline || [];
        if (timeline) {
          timeline = timeline.map((evt: any) => {
            let desc = evt.description || '';
            if (privacyMode) {
              if (desc.startsWith('Saved file: ')) {
                const filePart = desc.substring(12);
                const ext = filePart.includes('.') ? filePart.substring(filePart.lastIndexOf('.')) : '';
                const base = ext ? filePart.substring(0, filePart.lastIndexOf('.')) : filePart;
                desc = `Saved file: file_${simpleHash(base)}${ext}`;
              } else if (desc.startsWith('Opened file: ')) {
                const filePart = desc.substring(13);
                const ext = filePart.includes('.') ? filePart.substring(filePart.lastIndexOf('.')) : '';
                const base = ext ? filePart.substring(0, filePart.lastIndexOf('.')) : filePart;
                desc = `Opened file: file_${simpleHash(base)}${ext}`;
              } else if (desc.startsWith('Switched Git Branch to ')) {
                const branchPart = desc.substring(23);
                desc = `Switched Git Branch to branch_${simpleHash(branchPart)}`;
              } else if (desc.startsWith('Executed Terminal Command: ')) {
                desc = `Executed Terminal Command: [terminal]`;
              }
            } else {
              if (desc.startsWith('Executed Terminal Command: ')) {
                const cmdPart = desc.substring(27);
                desc = `Executed Terminal Command: ${redactSecrets(cmdPart).slice(0, 30)}`;
              }
            }
            return {
              ...evt,
              description: desc
            };
          });
        }

        return {
          id: s.id,
          user_id: userId,
          start_time: s.startTime,
          end_time: s.endTime,
          duration: Math.round(s.duration || 0),
          workspace_name: workspaceName,
          workspace_path: workspacePath,
          repository: repository,
          branch: branch,
          coding_time: Math.round(s.codingTime || 0),
          reading_time: Math.round(s.readingTime || 0),
          debugging_time: Math.round(s.debuggingTime || 0),
          terminal_time: Math.round(s.terminalTime || 0),
          git_time: Math.round(s.gitTime || 0),
          testing_time: Math.round(s.testingTime || 0),
          ai_time: Math.round(s.aiTime || 0),
          edits_count: s.editsCount || 0,
          reads_count: s.readsCount || 0,
          languages: s.languages || {},
          git_commits_count: s.gitCommitsCount || 0,
          debug_sessions_count: s.debugSessionsCount || 0,
          test_runs_success: s.testRunsSuccess || 0,
          test_runs_failed: s.testRunsFailed || 0,
          terminal_commands_count: terminalCommands.length,
          timeline: timeline.slice(-20) // last 20 events only
        };
      });

      // Post sessions in bulk to Supabase
      await apiClient.post('/dev_sessions', rows, {
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });
    }

    // 3. Sync Daily Progress
    const localDailyProgress = localDb.dailyProgress || {};
    const progressEntries = Object.entries(localDailyProgress);
    
    if (progressEntries.length > 0) {
      const dpRows = progressEntries.map(([date, dp]: [string, any]) => {
        let projects = dp.projects || {};
        if (privacyMode && projects) {
          const newProjects: Record<string, number> = {};
          for (const [proj, sec] of Object.entries(projects)) {
            const maskedProj = proj !== 'No Workspace' ? `Project_${simpleHash(proj)}` : proj;
            newProjects[maskedProj] = sec as number;
          }
          projects = newProjects;
        }

        return {
          user_id: userId,
          date,
          coding_time: Math.round(dp.codingTime || 0),
          development_time: Math.round(dp.developmentTime || 0),
          goal_seconds: dp.goalSeconds || 14400,
          is_completed: dp.isCompleted || false,
          sessions_count: dp.sessionsCount || 0,
          commits_count: dp.commitsCount || 0,
          terminal_time: Math.round(dp.terminalTime || 0),
          ai_time: Math.round(dp.aiTime || 0),
          projects,
          languages: dp.languages || {}
        };
      });

      await apiClient.post('/dev_daily_progress', dpRows, {
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });
    }

    // 4. Sync Streaks
    const localStreaks = localDb.streaks || {};
    if (localStreaks.development || localStreaks.coding) {
      const streakRow = {
        user_id: userId,
        coding_current: localStreaks.coding?.currentStreak || 0,
        coding_longest: localStreaks.coding?.longestStreak || 0,
        coding_last_active: localStreaks.coding?.lastActiveDate || '',
        development_current: localStreaks.development?.currentStreak || 0,
        development_longest: localStreaks.development?.longestStreak || 0,
        development_last_active: localStreaks.development?.lastActiveDate || '',
        updated_at: new Date().toISOString()
      };

      await apiClient.post('/dev_streaks', streakRow, {
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });
    }

    return {
      success: true,
      syncedSessionsCount: sessionsToSync.length
    };
  } catch (err: any) {
    console.error('[SyncEngine] Cloud sync failed:', err);
    return {
      success: false,
      syncedSessionsCount: 0,
      error: err.response?.data?.message || err.message || 'Sync request failed'
    };
  }
}

function simpleHash(str: string): string {
  if (!str) return '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
}

function redactSecrets(cmd: string): string {
  if (!cmd) return '';
  // Mask assignments like token=..., password=...
  let redacted = cmd.replace(
    /(['"]?\b(?:token|auth|key|password|pass|secret|credential|pwd|apiKey)\b['"]?\s*[:=]\s*)(['"]?)([^'"\s&|;<>]+)\2/gi,
    '$1$2[REDACTED]$2'
  );
  // Mask CLI parameters like --token secret, -p secret
  redacted = redacted.replace(
    /(\b(?:-p|--password|--token|--key|--secret|--api-key)\s+)(['"]?)([^'"\s&|;<>]+)\2/gi,
    '$1$2[REDACTED]$2'
  );
  return redacted;
}
