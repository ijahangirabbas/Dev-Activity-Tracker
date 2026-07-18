-- =============================================
-- Dev Activity Tracker — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Dev Sessions Table
CREATE TABLE IF NOT EXISTS dev_sessions (
  id                    TEXT PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  start_time            BIGINT NOT NULL,
  end_time              BIGINT NOT NULL,
  duration              INTEGER NOT NULL DEFAULT 0,   -- seconds

  workspace_name        TEXT DEFAULT '',
  workspace_path        TEXT DEFAULT '',
  repository            TEXT DEFAULT '',
  branch                TEXT DEFAULT '',

  -- Activity times (seconds)
  coding_time           INTEGER DEFAULT 0,
  reading_time          INTEGER DEFAULT 0,
  debugging_time        INTEGER DEFAULT 0,
  terminal_time         INTEGER DEFAULT 0,
  git_time              INTEGER DEFAULT 0,
  testing_time          INTEGER DEFAULT 0,
  ai_time               INTEGER DEFAULT 0,

  -- Interaction counts
  edits_count           INTEGER DEFAULT 0,
  reads_count           INTEGER DEFAULT 0,

  -- Aggregated stats
  languages             JSONB DEFAULT '{}',
  git_commits_count     INTEGER DEFAULT 0,
  debug_sessions_count  INTEGER DEFAULT 0,
  test_runs_success     INTEGER DEFAULT 0,
  test_runs_failed      INTEGER DEFAULT 0,
  terminal_commands_count INTEGER DEFAULT 0,

  -- Recent activity log (last 20 events)
  timeline              JSONB DEFAULT '[]',

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Progress Table
CREATE TABLE IF NOT EXISTS dev_daily_progress (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date                  TEXT NOT NULL,              -- YYYY-MM-DD
  coding_time           INTEGER DEFAULT 0,          -- seconds
  development_time      INTEGER DEFAULT 0,          -- seconds
  goal_seconds          INTEGER DEFAULT 14400,      -- 4 hours default
  is_completed          BOOLEAN DEFAULT FALSE,
  sessions_count        INTEGER DEFAULT 0,
  commits_count         INTEGER DEFAULT 0,
  terminal_time         INTEGER DEFAULT 0,
  ai_time               INTEGER DEFAULT 0,

  projects              JSONB DEFAULT '{}',         -- {projectName: seconds}
  languages             JSONB DEFAULT '{}',         -- {languageId: seconds}

  UNIQUE (user_id, date)
);

-- 3. Streaks Table
CREATE TABLE IF NOT EXISTS dev_streaks (
  user_id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  coding_current            INTEGER DEFAULT 0,
  coding_longest            INTEGER DEFAULT 0,
  coding_last_active        TEXT DEFAULT '',

  development_current       INTEGER DEFAULT 0,
  development_longest       INTEGER DEFAULT 0,
  development_last_active   TEXT DEFAULT '',

  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (only you see your data)
-- =============================================
ALTER TABLE dev_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_daily_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_streaks          ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "sessions_self_access" ON dev_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily progress policies
CREATE POLICY "daily_self_access" ON dev_daily_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "streaks_self_access" ON dev_streaks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Useful Indexes for dashboard queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_start    ON dev_sessions (user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_workspace      ON dev_sessions (user_id, workspace_name);
CREATE INDEX IF NOT EXISTS idx_daily_user_date         ON dev_daily_progress (user_id, date DESC);

-- =============================================
-- Done! Setup complete.
-- The DevTracker extension does not need your Supabase credentials directly.
-- Instead, pairing is handled securely via UUID and pairing token in settings.
-- =============================================
