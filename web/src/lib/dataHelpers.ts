import { DevSession, FileStats, TimelineEvent } from 'web/types';

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lifetime';

export function filterSessionsByRange(sessions: DevSession[], range: TimeRange): DevSession[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  return sessions.filter(s => {
    switch (range) {
      case 'today':
        return s.startTime >= todayStart;
      case 'yesterday':
        return s.startTime >= (todayStart - oneDay) && s.startTime < todayStart;
      case '7days':
        return s.startTime >= (todayStart - 7 * oneDay);
      case '30days':
        return s.startTime >= (todayStart - 30 * oneDay);
      case 'thisMonth':
        return new Date(s.startTime).getMonth() === now.getMonth() && new Date(s.startTime).getFullYear() === now.getFullYear();
      case 'lifetime':
      default:
        return true;
    }
  });
}

export interface AggregatedStats {
  totalDuration: number;
  codingTime: number;
  readingTime: number;
  debuggingTime: number;
  terminalTime: number;
  gitTime: number;
  testingTime: number;
  aiTime: number;
  todayDuration: number;
  terminalCommandsCount: number;
  languages: Record<string, number>;
  projects: Record<string, number>;
  files: Record<string, FileStats>;
  timelineEvents: (TimelineEvent & { projectName: string })[];
}

export function aggregateStats(sessions: DevSession[]): AggregatedStats {
  const stats: AggregatedStats = {
    totalDuration: 0,
    codingTime: 0,
    readingTime: 0,
    debuggingTime: 0,
    terminalTime: 0,
    gitTime: 0,
    testingTime: 0,
    aiTime: 0,
    todayDuration: 0,
    terminalCommandsCount: 0,
    languages: {},
    projects: {},
    files: {},
    timelineEvents: []
  };

  const todayStr = localDateStr(new Date());

  sessions.forEach(s => {
    stats.totalDuration += s.duration;
    stats.codingTime += s.codingTime;
    stats.readingTime += s.readingTime;
    stats.debuggingTime += s.debuggingTime;
    stats.terminalTime += s.terminalTime;
    stats.gitTime += s.gitTime;
    stats.testingTime += s.testingTime;
    stats.aiTime += s.aiTime;
    stats.terminalCommandsCount += (s.terminalCommands || []).length;

    // Track today's time for the goal check
    const sessionDateStr = localDateStr(new Date(s.startTime));
    if (sessionDateStr === todayStr) {
      stats.todayDuration += s.duration;
    }

    // Aggregate languages
    for (const [lang, sec] of Object.entries(s.languages || {})) {
      stats.languages[lang] = (stats.languages[lang] || 0) + sec;
    }

    // Aggregate projects
    const proj = s.workspaceName || 'Unknown Project';
    stats.projects[proj] = (stats.projects[proj] || 0) + s.duration;

    // Aggregate files
    for (const [file, fileStats] of Object.entries(s.files || {})) {
      if (!stats.files[file]) {
        stats.files[file] = {
          fileName: fileStats.fileName,
          relativePath: fileStats.relativePath,
          languageId: fileStats.languageId,
          timeSpent: 0,
          editsCount: 0,
          readsCount: 0,
          lastActive: 0
        };
      }
      stats.files[file].timeSpent += fileStats.timeSpent;
      stats.files[file].editsCount += fileStats.editsCount;
      stats.files[file].readsCount += fileStats.readsCount;
    }

    // Gather timeline events
    if (s.timeline) {
      s.timeline.forEach(evt => {
        stats.timelineEvents.push({
          ...evt,
          projectName: s.workspaceName || 'Unknown Project'
        });
      });
    }
  });

  // Sort timeline chronologically descending
  stats.timelineEvents.sort((a, b) => b.timestamp - a.timestamp);

  return stats;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds)) { return '0m'; }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatHoursDecimal(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds)) { return '0.0'; }
  return (seconds / 3600).toFixed(1);
}

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
