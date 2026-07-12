import { apiClient } from './api';
import { supabase } from './supabase';
import { DevSession } from '../types';

export interface SyncResult {
  success: boolean;
  syncedSessionsCount: number;
  error?: string;
}

export async function syncLocalDataToCloud(localDb: any): Promise<SyncResult> {
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
      const rows = sessionsToSync.map((s: any) => ({
        id: s.id,
        user_id: userId,
        start_time: s.startTime,
        end_time: s.endTime,
        duration: Math.round(s.duration || 0),
        workspace_name: s.workspaceName || '',
        workspace_path: s.workspacePath || '',
        repository: s.repository || '',
        branch: s.branch || '',
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
        terminal_commands_count: (s.terminalCommands || []).length,
        timeline: (s.timeline || []).slice(-20) // last 20 events only
      }));

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
      const dpRows = progressEntries.map(([date, dp]: [string, any]) => ({
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
        projects: dp.projects || {},
        languages: dp.languages || {}
      }));

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
