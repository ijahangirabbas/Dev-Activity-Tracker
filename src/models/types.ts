export interface TimelineEvent {
  timestamp: number;
  description: string;
  category: 'system' | 'coding' | 'reading' | 'debugging' | 'terminal' | 'git' | 'testing' | 'ai' | 'idle';
}

export interface FileStats {
  relativePath: string;
  fileName: string;
  languageId: string;
  timeSpent: number; // in seconds
  editsCount: number;
  readsCount: number;
  lastActive: number;
}

export interface TerminalCommandEvent {
  command: string;
  category: string; // package-manager, git, docker, test, dev, build, other
  timestamp: number;
}

export interface DevSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  workspaceName: string;
  workspacePath: string;
  repository: string;
  branch: string;
  
  // Categorized times (in seconds)
  codingTime: number;
  readingTime: number;
  debuggingTime: number;
  terminalTime: number;
  gitTime: number;
  testingTime: number;
  aiTime: number;

  // Interaction counts
  editsCount: number;
  readsCount: number;
  
  // Specific activities
  files: Record<string, FileStats>; // key is file relative path
  languages: Record<string, number>; // languageId -> seconds
  terminalCommands: TerminalCommandEvent[];
  terminalSessionsCount: number;
  gitCommitsCount: number;
  debugSessionsCount: number;
  testRunsSuccess: number;
  testRunsFailed: number;

  timeline: TimelineEvent[];
}

export interface ProjectStats {
  name: string;
  repository: string;
  totalTime: number; // in seconds
  todayTime: number;
  weeklyTime: number;
  monthlyTime: number;
  
  editsCount: number;
  readsCount: number;
  commitsCount: number;
  terminalTime: number;
  aiTime: number;
  
  languages: Record<string, number>; // languageId -> seconds
  files: Record<string, number>; // relativePath -> seconds
  branches: string[];
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  codingTime: number;
  developmentTime: number;
  goalSeconds: number;
  isCompleted: boolean;
  sessionsCount: number;
  commitsCount: number;
  terminalTime: number;
  aiTime: number;
  projects: Record<string, number>; // projectName -> seconds
  languages: Record<string, number>; // languageId -> seconds
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface DatabaseSchema {
  version: number;
  sessions: DevSession[];
  projects: Record<string, ProjectStats>;
  dailyProgress: Record<string, DailyProgress>;
  streaks: {
    coding: StreakStats;
    development: StreakStats;
  };
}

export interface ExtensionConfig {
  idleTimeout: number; // in seconds
  dailyGoal: number; // in seconds
  privacyMode: boolean;
  showStatusBar: boolean;
  supabaseUrl: string;
  supabaseServiceKey: string;
  supabaseUserId: string;
}
