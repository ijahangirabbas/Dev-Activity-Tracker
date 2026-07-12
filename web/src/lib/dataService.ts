import { DevSession, DailyProgress, DBStreak } from 'web/types';
import { apiClient } from './api';
import { syncLocalDataToCloud } from './syncService';

// Global cache to check if the local VS Code server is offline, avoiding multiple timeout hangs
let isLocalServerOffline = false;
let lastLocalCheckTime = 0;

// Helper to trigger background sync if auto-sync is enabled
let isSyncingInProgress = false;

export function triggerBackgroundSync(localDb: any) {
  if (isSyncingInProgress) return;
  const isAutoSyncEnabled = localStorage.getItem('dev_tracker_auto_sync') !== 'false';
  if (!isAutoSyncEnabled) return;

  isSyncingInProgress = true;
  syncLocalDataToCloud(localDb)
    .then((result) => {
      if (result.success && result.syncedSessionsCount > 0) {
        console.log(`[SyncEngine] Automatically synced ${result.syncedSessionsCount} sessions to cloud.`);
      }
    })
    .catch((err) => {
      console.error('[SyncEngine] Background sync failed:', err);
    })
    .finally(() => {
      isSyncingInProgress = false;
    });
}

// Helper to fetch data from the background VS Code API server if online
async function fetchLocalData(): Promise<any> {
  const now = Date.now();
  // If marked offline in the last 15 seconds, bypass checking to prevent browser load hangs
  if (isLocalServerOffline && now - lastLocalCheckTime < 15000) {
    throw new Error('Local server cached offline');
  }

  const controller = new AbortController();
  // Fast 250ms timeout is plenty of time for a local loopback request
  const timeoutId = setTimeout(() => controller.abort(), 250);

  try {
    const res = await fetch('http://localhost:54321/api/data', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Local server HTTP error');
    
    // Server is online
    isLocalServerOffline = false;
    lastLocalCheckTime = now;
    return await res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    // Mark server as offline to fallback immediately on subsequent parallel query triggers
    isLocalServerOffline = true;
    lastLocalCheckTime = now;
    throw e;
  }
}

export const sessionApi = {
  // Get all sessions
  getAll: async (): Promise<DevSession[]> => {
    try {
      const local = await fetchLocalData();
      if (local && local.db && Array.isArray(local.db.sessions)) {
        triggerBackgroundSync(local.db);
        const sessions = local.db.sessions.map((s: any) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          duration: s.duration,
          workspaceName: s.workspaceName || '',
          workspacePath: s.workspacePath || '',
          repository: s.repository || '',
          branch: s.branch || '',
          codingTime: s.codingTime || 0,
          readingTime: s.readingTime || 0,
          debuggingTime: s.debuggingTime || 0,
          terminalTime: s.terminalTime || 0,
          gitTime: s.gitTime || 0,
          testingTime: s.testingTime || 0,
          aiTime: s.aiTime || 0,
          editsCount: s.editsCount || 0,
          readsCount: s.readsCount || 0,
          languages: s.languages || {},
          terminalCommands: s.terminalCommands || [],
          gitCommitsCount: s.gitCommitsCount || 0,
          debugSessionsCount: s.debugSessionsCount || 0,
          testRunsSuccess: s.testRunsSuccess || 0,
          testRunsFailed: s.testRunsFailed || 0
        }));
        // Return latest first
        return sessions.sort((a: any, b: any) => b.startTime - a.startTime);
      }
    } catch (err) {
      // Quietly fall through to Supabase order query
    }

    const { data } = await apiClient.get<DevSession[]>('/dev_sessions?order=start_time.desc');
    return data;
  },

  // Get single session details
  getOne: async (id: string): Promise<DevSession> => {
    try {
      const local = await fetchLocalData();
      if (local && local.db && Array.isArray(local.db.sessions)) {
        const found = local.db.sessions.find((s: any) => s.id === id);
        if (found) return found;
      }
    } catch (err) {}

    const { data } = await apiClient.get<DevSession[]>(`/dev_sessions?id=eq.${id}`);
    if (data.length === 0) throw new Error('Session not found');
    return data[0];
  },
};

export const progressApi = {
  // Get progress metrics
  getAll: async (): Promise<DailyProgress[]> => {
    try {
      const local = await fetchLocalData();
      if (local && local.db && local.db.dailyProgress) {
        triggerBackgroundSync(local.db);
        const progressList = Object.values(local.db.dailyProgress).map((dp: any) => ({
          date: dp.date,
          codingTime: dp.codingTime || 0,
          developmentTime: dp.developmentTime || 0,
          goalSeconds: dp.goalSeconds || 14400,
          isCompleted: dp.isCompleted || false,
          sessionsCount: dp.sessionsCount || 0,
          commitsCount: dp.commitsCount || 0,
          terminalTime: dp.terminalTime || 0,
          aiTime: dp.aiTime || 0,
          projects: dp.projects || {},
          languages: dp.languages || {}
        }));
        return progressList.sort((a: any, b: any) => b.date.localeCompare(a.date));
      }
    } catch (err) {}

    const { data } = await apiClient.get<DailyProgress[]>('/dev_daily_progress?order=date.desc');
    return data;
  },
};

export const streakApi = {
  // Get streak status
  get: async (): Promise<DBStreak[]> => {
    try {
      const local = await fetchLocalData();
      if (local && local.db && local.db.streaks) {
        triggerBackgroundSync(local.db);
        const streaks = local.db.streaks;
        return [{
          user_id: 'local_user',
          coding_current: streaks.coding?.currentStreak || 0,
          coding_longest: streaks.coding?.longestStreak || 0,
          coding_last_active: streaks.coding?.lastActiveDate || '',
          development_current: streaks.development?.currentStreak || 0,
          development_longest: streaks.development?.longestStreak || 0,
          development_last_active: streaks.development?.lastActiveDate || ''
        }];
      }
    } catch (err) {}

    const { data } = await apiClient.get<DBStreak[]>('/dev_streaks');
    return data;
  },
};
