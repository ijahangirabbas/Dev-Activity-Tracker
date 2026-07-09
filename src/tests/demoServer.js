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
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PORT = 8080;
// Generate realistic mock database for demo
function generateMockDb() {
    const sessions = [];
    const dailyProgress = {};
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    // Projects list
    const projects = [
        { name: 'Persona AI', repo: 'persona-ai' },
        { name: 'Dev extension', repo: 'dev-activity-tracker' },
        { name: 'DSA Practice', repo: 'algorithms-dsa' }
    ];
    // Languages list
    const languages = ['TypeScript', 'JavaScript', 'Python', 'HTML', 'CSS', 'JSON', 'Markdown'];
    // Terminal commands categories
    const commands = [
        { command: 'npm run dev', category: 'dev' },
        { command: 'git status', category: 'git' },
        { command: 'git add .', category: 'git' },
        { command: 'git commit -m "update layout"', category: 'git' },
        { command: 'git push origin main', category: 'git' },
        { command: 'docker compose up -d', category: 'docker' },
        { command: 'npm install lucide-react', category: 'package-manager' },
        { command: 'npm run build', category: 'build' },
        { command: 'pytest tests/', category: 'test' }
    ];
    // File paths list
    const files = [
        { name: 'tracker.ts', path: 'src/tracking/tracker.ts', lang: 'TypeScript' },
        { name: 'database.ts', path: 'src/storage/database.ts', lang: 'TypeScript' },
        { name: 'dashboard.js', path: 'src/views/dashboard.js', lang: 'JavaScript' },
        { name: 'dashboard.css', path: 'src/views/dashboard.css', lang: 'CSS' },
        { name: 'index.py', path: 'api/index.py', lang: 'Python' },
        { name: 'package.json', path: 'package.json', lang: 'JSON' },
        { name: 'README.md', path: 'README.md', lang: 'Markdown' }
    ];
    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
        const dayTimestamp = now - i * oneDay;
        const dateStr = new Date(dayTimestamp).toISOString().slice(0, 10);
        // Skip some days to make streaks realistic (e.g. active 24 out of 30 days)
        if (i === 15 || i === 22 || i === 8) {
            continue;
        }
        const sessionsCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 sessions per day
        let dailyDevTime = 0;
        let dailyCodingTime = 0;
        let dailyCommits = 0;
        let dailyTerminalTime = 0;
        let dailyAiTime = 0;
        const dailyProjs = {};
        const dailyLangs = {};
        for (let s = 0; s < sessionsCount; s++) {
            const sessionDuration = Math.floor(Math.random() * 7200) + 1800; // 30 mins to 2.5 hours
            const codingTime = Math.floor(sessionDuration * (0.3 + Math.random() * 0.4)); // 30% to 70% is coding
            const readingTime = Math.floor(sessionDuration * (0.2 + Math.random() * 0.2));
            const debuggingTime = Math.floor(sessionDuration * (0.05 + Math.random() * 0.15));
            const terminalTime = Math.floor(sessionDuration * (0.05 + Math.random() * 0.1));
            const gitTime = Math.floor(sessionDuration * (0.01 + Math.random() * 0.04));
            const aiTime = Math.floor(sessionDuration * (0.02 + Math.random() * 0.08));
            const testingTime = sessionDuration - (codingTime + readingTime + debuggingTime + terminalTime + gitTime + aiTime);
            const proj = projects[Math.floor(Math.random() * projects.length)];
            const branch = Math.random() > 0.5 ? 'main' : 'feat/dashboard-ui';
            // Pick terminal commands
            const sessionCmds = [];
            const cmdCount = Math.floor(Math.random() * 4);
            for (let c = 0; c < cmdCount; c++) {
                sessionCmds.push({
                    ...commands[Math.floor(Math.random() * commands.length)],
                    timestamp: dayTimestamp + s * 3600000 + c * 600000
                });
            }
            // Pick files edited
            const sessionFiles = {};
            const fileCount = Math.floor(Math.random() * 3) + 1;
            for (let f = 0; f < fileCount; f++) {
                const file = files[Math.floor(Math.random() * files.length)];
                const fileTime = Math.floor(sessionDuration * (0.1 + Math.random() * 0.2));
                sessionFiles[file.path] = {
                    relativePath: file.path,
                    fileName: file.name,
                    languageId: file.lang,
                    timeSpent: fileTime,
                    editsCount: Math.floor(fileTime / 120),
                    readsCount: Math.floor(fileTime / 80),
                    lastActive: dayTimestamp
                };
                dailyLangs[file.lang] = (dailyLangs[file.lang] || 0) + fileTime;
            }
            const commitsCount = Math.random() > 0.6 ? 1 : 0;
            dailyCommits += commitsCount;
            const sessionObj = {
                id: `session_${dayTimestamp}_${s}`,
                startTime: dayTimestamp + s * 3600000,
                endTime: dayTimestamp + s * 3600000 + sessionDuration * 1000,
                duration: sessionDuration,
                workspaceName: proj.name,
                workspacePath: `C:\\Projects\\${proj.repo}`,
                repository: proj.repo,
                branch: branch,
                codingTime,
                readingTime,
                debuggingTime,
                terminalTime,
                gitTime,
                testingTime,
                aiTime,
                editsCount: Math.floor(codingTime / 60),
                readsCount: Math.floor(readingTime / 90),
                files: sessionFiles,
                languages: dailyLangs,
                terminalCommands: sessionCmds,
                terminalSessionsCount: Math.random() > 0.5 ? 2 : 1,
                gitCommitsCount: commitsCount,
                debugSessionsCount: debuggingTime > 0 ? 1 : 0,
                testRunsSuccess: testingTime > 300 ? 1 : 0,
                testRunsFailed: 0,
                timeline: [
                    { timestamp: dayTimestamp + s * 3600000, description: 'VS Code Session Started', category: 'system' },
                    { timestamp: dayTimestamp + s * 3600000 + 300000, description: `Opened file: ${files[0].name}`, category: 'reading' },
                    { timestamp: dayTimestamp + s * 3600000 + 1200000, description: 'Coding activity recorded', category: 'coding' }
                ]
            };
            sessions.push(sessionObj);
            dailyDevTime += sessionDuration;
            dailyCodingTime += codingTime;
            dailyTerminalTime += terminalTime;
            dailyAiTime += aiTime;
            dailyProjs[proj.name] = (dailyProjs[proj.name] || 0) + sessionDuration;
        }
        dailyProgress[dateStr] = {
            date: dateStr,
            codingTime: dailyCodingTime,
            developmentTime: dailyDevTime,
            goalSeconds: 14400, // 4 hours
            isCompleted: dailyDevTime >= 14400,
            sessionsCount,
            commitsCount: dailyCommits,
            terminalTime: dailyTerminalTime,
            aiTime: dailyAiTime,
            projects: dailyProjs,
            languages: dailyLangs
        };
    }
    // Aggregate project statistics
    const projectStats = {};
    sessions.forEach(s => {
        const name = s.workspaceName;
        if (!projectStats[name]) {
            projectStats[name] = {
                name,
                repository: s.repository,
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
        const p = projectStats[name];
        p.totalTime += s.duration;
        p.editsCount += s.editsCount;
        p.readsCount += s.readsCount;
        p.commitsCount += s.gitCommitsCount;
        p.terminalTime += s.terminalTime;
        p.aiTime += s.aiTime;
        if (!p.branches.includes(s.branch)) {
            p.branches.push(s.branch);
        }
    });
    return {
        version: 1,
        sessions,
        projects: projectStats,
        dailyProgress,
        streaks: {
            coding: { currentStreak: 7, longestStreak: 12, lastActiveDate: new Date(now).toISOString().slice(0, 10) },
            development: { currentStreak: 9, longestStreak: 18, lastActiveDate: new Date(now).toISOString().slice(0, 10) }
        }
    };
}
const server = http.createServer((req, res) => {
    const decodedUrl = decodeURIComponent(req.url || '');
    if (decodedUrl === '/' || decodedUrl === '/index.html') {
        const htmlPath = path.join(__dirname, '..', 'views', 'dashboard.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        // Replace CSS and JS links to relative server paths
        html = html.replace('id="style-link" href=""', 'id="style-link" href="/dashboard.css"');
        html = html.replace('id="script-link" src=""', 'id="script-link" src="/dashboard.js"');
        // Inject mock API bridge for browser execution
        const scriptInject = `
      <script>
        // Mock VS Code Webview API
        window.acquireVsCodeApi = function() {
          return {
            postMessage: function(message) {
              console.log('Mock Webview PostMessage:', message);
              if (message.command === 'getData') {
                window.postMessage({
                  command: 'updateData',
                  db: ${JSON.stringify(generateMockDb())},
                  config: {
                    idleTimeout: 300,
                    dailyGoal: 14400,
                    privacyMode: false,
                    showStatusBar: true
                  }
                }, '*');
              }
            }
          };
        };
      </script>
    `;
        html = html.replace('</head>', `${scriptInject}</head>`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    else if (decodedUrl === '/dashboard.css') {
        const cssPath = path.join(__dirname, '..', 'views', 'dashboard.css');
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(fs.readFileSync(cssPath, 'utf8'));
    }
    else if (decodedUrl === '/dashboard.js') {
        const jsPath = path.join(__dirname, '..', 'views', 'dashboard.js');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync(jsPath, 'utf8'));
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});
server.listen(PORT, () => {
    console.log(`Demo mock server started at http://localhost:${PORT}`);
});
