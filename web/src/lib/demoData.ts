import { DevSession, DailyProgress, DBStreak } from '../types';

export function getMockSessions(): DevSession[] {
  const sessions: DevSession[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Let's create mock projects and languages
  const projects = [
    { name: 'dev-activity-tracker', path: 'j:\\Projects\\dev-activity-tracker', repo: 'github.com/ijahangirabbas/Dev-Activity-Tracker', branch: 'main' },
    { name: 'emergent-sh', path: 'j:\\Projects\\emergent-sh', repo: 'github.com/emergent-sh/app', branch: 'feat/testflight-sync' },
    { name: 'pulse-analytics', path: 'j:\\Projects\\pulse-analytics', repo: 'github.com/jeem-labs/pulse', branch: 'main' }
  ];

  // We generate 25 sessions spread over the last 30 days
  for (let i = 0; i < 25; i++) {
    const dayOffset = i * 1.1; // spread sessions
    const sessionTime = now - Math.floor(dayOffset * oneDay) - (Math.random() * 4 * 3600 * 1000);
    const duration = Math.floor(1800 + Math.random() * 7200); // 30 mins to 2.5 hours
    const project = projects[i % projects.length];

    const codingRatio = 0.4 + Math.random() * 0.3;
    const readingRatio = 0.2 + Math.random() * 0.15;
    const terminalRatio = 0.1 + Math.random() * 0.1;
    const debuggingRatio = i % 4 === 0 ? 0.1 + Math.random() * 0.15 : 0;
    const gitRatio = 0.02 + Math.random() * 0.05;
    const testingRatio = i % 5 === 0 ? 0.05 + Math.random() * 0.05 : 0;
    const aiRatio = 0.05 + Math.random() * 0.1;

    const codingTime = Math.floor(duration * codingRatio);
    const readingTime = Math.floor(duration * readingRatio);
    const terminalTime = Math.floor(duration * terminalRatio);
    const debuggingTime = Math.floor(duration * debuggingRatio);
    const gitTime = Math.floor(duration * gitRatio);
    const testingTime = Math.floor(duration * testingRatio);
    const aiTime = Math.floor(duration * aiRatio);

    const editsCount = Math.floor(codingTime / 15);
    const readsCount = Math.floor(readingTime / 30);

    const languages: Record<string, number> = {};
    if (project.name === 'dev-activity-tracker') {
      languages['TypeScript'] = Math.floor(codingTime * 0.85);
      languages['HTML'] = Math.floor(codingTime * 0.1);
      languages['CSS'] = Math.floor(codingTime * 0.05);
    } else if (project.name === 'emergent-sh') {
      languages['Swift'] = Math.floor(codingTime * 0.9);
      languages['Objective-C'] = Math.floor(codingTime * 0.1);
    } else {
      languages['JavaScript'] = Math.floor(codingTime * 0.7);
      languages['Python'] = Math.floor(codingTime * 0.3);
    }

    const files: Record<string, any> = {};
    const fileList = project.name === 'dev-activity-tracker'
      ? ['src/extension.ts', 'src/tracking/tracker.ts', 'views/dashboard.js', 'package.json']
      : project.name === 'emergent-sh'
      ? ['ios/App/AppDelegate.swift', 'ios/App/MainViewController.swift', 'emergent/Config.plist']
      : ['server/index.js', 'client/src/App.jsx', 'package.json'];

    fileList.forEach((file, index) => {
      const timeSpent = Math.floor(duration * (0.1 + Math.random() * 0.3));
      files[file] = {
        relativePath: `${project.path}\\${file}`,
        fileName: file.split('/').pop() || '',
        languageId: file.endsWith('.ts') || file.endsWith('.tsx') ? 'TypeScript' : file.endsWith('.swift') ? 'Swift' : 'JavaScript',
        timeSpent,
        editsCount: Math.floor(timeSpent / 25),
        readsCount: Math.floor(timeSpent / 50),
        lastActive: sessionTime + timeSpent * 1000
      };
    });

    const commands = [
      { command: 'npm run dev', category: 'dev' },
      { command: 'git commit -m "feat: sync logs"', category: 'git' },
      { command: 'npm install lucide-react', category: 'package-manager' },
      { command: 'vitest run', category: 'test' },
      { command: 'docker-compose up -d', category: 'docker' }
    ];

    const terminalCommands = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
      const cmd = commands[Math.floor(Math.random() * commands.length)];
      return {
        command: cmd.command,
        category: cmd.category,
        timestamp: sessionTime + (Math.random() * duration * 1000)
      };
    });

    const timeline = [
      { timestamp: sessionTime, description: 'VS Code Session Started', category: 'system' as const },
      { timestamp: sessionTime + 200 * 1000, description: `Opened file: ${fileList[0]}`, category: 'reading' as const },
      { timestamp: sessionTime + 1200 * 1000, description: `Saved file: ${fileList[0]}`, category: 'coding' as const },
      { timestamp: sessionTime + 1800 * 1000, description: `Executed Terminal Command: ${terminalCommands[0]?.command || 'git status'}`, category: 'terminal' as const },
      { timestamp: sessionTime + duration * 1000, description: 'VS Code Session Ended', category: 'system' as const }
    ];

    sessions.push({
      id: `mock_session_${i}_${now - dayOffset * oneDay}`,
      startTime: sessionTime,
      endTime: sessionTime + duration * 1000,
      duration,
      workspaceName: project.name,
      workspacePath: project.path,
      repository: project.repo,
      branch: project.branch,
      codingTime,
      readingTime,
      debuggingTime,
      terminalTime,
      gitTime,
      testingTime,
      aiTime,
      editsCount,
      readsCount,
      files,
      languages,
      terminalCommands,
      terminalSessionsCount: 1 + Math.floor(Math.random() * 2),
      gitCommitsCount: i % 3 === 0 ? 1 : 0,
      debugSessionsCount: debuggingTime > 0 ? 1 : 0,
      testRunsSuccess: testingTime > 0 ? 1 : 0,
      testRunsFailed: testingTime > 0 && Math.random() < 0.2 ? 1 : 0,
      timeline
    });
  }

  return sessions.sort((a, b) => b.startTime - a.startTime);
}

export function getMockProgress(): DailyProgress[] {
  const progressList: DailyProgress[] = [];
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * oneDay);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 80% chance of coding activity on each day
    if (Math.random() < 0.8) {
      const developmentTime = Math.floor(7200 + Math.random() * 15000); // 2 to 6 hours
      const codingTime = Math.floor(developmentTime * (0.4 + Math.random() * 0.2));
      const terminalTime = Math.floor(developmentTime * (0.1 + Math.random() * 0.15));
      const aiTime = Math.floor(developmentTime * (0.05 + Math.random() * 0.1));

      progressList.push({
        date: dateStr,
        codingTime,
        developmentTime,
        goalSeconds: 14400, // 4 hours
        isCompleted: developmentTime >= 14400,
        sessionsCount: 1 + Math.floor(Math.random() * 3),
        commitsCount: Math.floor(Math.random() * 4),
        terminalTime,
        aiTime,
        projects: {
          'dev-activity-tracker': Math.floor(developmentTime * 0.5),
          'emergent-sh': Math.floor(developmentTime * 0.3),
          'pulse-analytics': Math.floor(developmentTime * 0.2)
        },
        languages: {
          'TypeScript': Math.floor(codingTime * 0.6),
          'Swift': Math.floor(codingTime * 0.3),
          'JavaScript': Math.floor(codingTime * 0.1)
        }
      });
    }
  }

  return progressList.sort((a, b) => b.date.localeCompare(a.date));
}

export function getMockStreaks(): DBStreak[] {
  return [{
    user_id: 'mock_user',
    coding_current: 8,
    coding_longest: 15,
    coding_last_active: new Date().toISOString().slice(0, 10),
    development_current: 12,
    development_longest: 24,
    development_last_active: new Date().toISOString().slice(0, 10),
    goal_seconds: 14400
  }];
}
