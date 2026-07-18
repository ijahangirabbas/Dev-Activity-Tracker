export interface SyncResult {
  success: boolean;
  error?: string;
  synced?: number;
}

export class SupabaseSyncService {
  private supabaseUrl: string;
  private serviceKey: string;
  private userId: string;

  constructor(supabaseUrl: string, serviceKey: string, userId: string) {
    this.supabaseUrl = supabaseUrl.replace(/\/$/, ''); // strip trailing slash
    this.serviceKey = serviceKey;
    this.userId = userId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };
  }

  public async syncSession(session: any): Promise<SyncResult> {
    if (!this.supabaseUrl || !this.serviceKey) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const row = {
        id: session.id,
        user_id: this.userId,
        start_time: session.startTime,
        end_time: session.endTime,
        duration: Math.round(session.duration),
        workspace_name: session.workspaceName || '',
        workspace_path: session.workspacePath || '',
        repository: session.repository || '',
        branch: session.branch || '',
        coding_time: Math.round(session.codingTime || 0),
        reading_time: Math.round(session.readingTime || 0),
        debugging_time: Math.round(session.debuggingTime || 0),
        terminal_time: Math.round(session.terminalTime || 0),
        git_time: Math.round(session.gitTime || 0),
        testing_time: Math.round(session.testingTime || 0),
        ai_time: Math.round(session.aiTime || 0),
        edits_count: session.editsCount || 0,
        reads_count: session.readsCount || 0,
        languages: session.languages || {},
        git_commits_count: session.gitCommitsCount || 0,
        debug_sessions_count: session.debugSessionsCount || 0,
        test_runs_success: session.testRunsSuccess || 0,
        test_runs_failed: session.testRunsFailed || 0,
        terminal_commands_count: (session.terminalCommands || []).length,
        timeline: (session.timeline || []).slice(-20) // last 20 events only
      };

      const response = await fetch(`${this.supabaseUrl}/rest/v1/dev_sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(row)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { success: true, synced: 1 };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async syncDailyProgress(date: string, progress: any): Promise<SyncResult> {
    if (!this.supabaseUrl || !this.serviceKey) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const row = {
        user_id: this.userId,
        date,
        coding_time: Math.round(progress.codingTime || 0),
        development_time: Math.round(progress.developmentTime || 0),
        goal_seconds: progress.goalSeconds || 14400,
        is_completed: progress.isCompleted || false,
        sessions_count: progress.sessionsCount || 0,
        commits_count: progress.commitsCount || 0,
        terminal_time: Math.round(progress.terminalTime || 0),
        ai_time: Math.round(progress.aiTime || 0),
        projects: progress.projects || {},
        languages: progress.languages || {}
      };

      const response = await fetch(`${this.supabaseUrl}/rest/v1/dev_daily_progress`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(row)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { success: true, synced: 1 };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async syncStreaks(streaks: any): Promise<SyncResult> {
    if (!this.supabaseUrl || !this.serviceKey) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const row = {
        user_id: this.userId,
        coding_current: streaks.coding?.currentStreak || 0,
        coding_longest: streaks.coding?.longestStreak || 0,
        coding_last_active: streaks.coding?.lastActiveDate || '',
        development_current: streaks.development?.currentStreak || 0,
        development_longest: streaks.development?.longestStreak || 0,
        development_last_active: streaks.development?.lastActiveDate || '',
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${this.supabaseUrl}/rest/v1/dev_streaks`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(row)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { success: true, synced: 1 };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public isConfigured(): boolean {
    return !!(this.supabaseUrl && this.serviceKey && this.userId);
  }
}
