(function() {
  const vscode = acquireVsCodeApi();
  let db = null;
  let activeConfig = null;

  // Initialize
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
      case 'updateData':
        db = message.db;
        activeConfig = message.config;
        updateUI();
        break;
    }
  });

  // Tab switching
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(target).classList.add('active');
    });
  });

  // Time range selector event
  const rangeSelect = document.getElementById('time-range-select');
  rangeSelect.addEventListener('change', () => {
    updateUI();
  });

  // Settings Save event
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  saveSettingsBtn.addEventListener('click', () => {
    const idleTimeout = parseInt(document.getElementById('setting-idle-timeout').value, 10);
    const dailyGoal = parseInt(document.getElementById('setting-daily-goal').value, 10) * 3600;
    const privacyMode = document.getElementById('setting-privacy-mode').checked;
    const showStatusBar = document.getElementById('setting-show-statusbar').checked;

    vscode.postMessage({
      command: 'saveSettings',
      config: { idleTimeout, dailyGoal, privacyMode, showStatusBar }
    });
  });

  // Export event
  document.getElementById('export-btn').addEventListener('click', () => {
    vscode.postMessage({
      command: 'exportData',
      range: rangeSelect.value
    });
  });

  // Backup & Restore events
  document.getElementById('backup-btn').addEventListener('click', () => {
    vscode.postMessage({ command: 'backup' });
  });

  document.getElementById('restore-btn').addEventListener('click', () => {
    vscode.postMessage({ command: 'restore' });
  });

  // File search filter
  const fileSearchInput = document.getElementById('file-search-input');
  fileSearchInput.addEventListener('input', () => {
    updateFilesList();
  });

  function updateUI() {
    if (!db) { return; }

    // Pre-fill settings form if activeConfig is available
    if (activeConfig) {
      document.getElementById('setting-idle-timeout').value = activeConfig.idleTimeout.toString();
      document.getElementById('setting-daily-goal').value = Math.round(activeConfig.dailyGoal / 3600).toString();
      document.getElementById('setting-privacy-mode').checked = activeConfig.privacyMode;
      document.getElementById('setting-show-statusbar').checked = activeConfig.showStatusBar;
    }

    const range = rangeSelect.value;
    const filteredSessions = filterSessionsByRange(db.sessions, range);
    
    // Aggregated stats
    const stats = aggregateStats(filteredSessions);

    // Update Overview Cards
    document.getElementById('dev-time-value').innerText = formatDuration(stats.totalDuration);
    document.getElementById('coding-time-value').innerText = formatDuration(stats.codingTime);
    
    const codingStreak = db.streaks.coding.currentStreak || 0;
    const devStreak = db.streaks.development.currentStreak || 0;
    document.getElementById('streak-value').innerText = `${devStreak} Days`;
    document.getElementById('streak-subtext').innerText = `Coding streak: ${codingStreak} days`;
    
    const projectsCount = Object.keys(stats.projects).length;
    document.getElementById('projects-value').innerText = projectsCount.toString();

    // Update Goal Completion
    updateGoalRing(stats.todayDuration);

    // Update Breakdown
    updateCategoryBreakdown(stats);

    // Update Languages
    updateLanguagesList(stats);

    // Update Projects
    updateProjectsList(stats);

    // Update Terminal & AI Info
    document.getElementById('terminal-active-time').innerText = formatDuration(stats.terminalTime);
    document.getElementById('terminal-commands-count').innerText = stats.terminalCommandsCount.toString();
    document.getElementById('ai-active-time').innerText = formatDuration(stats.aiTime);
    
    const aiPercentage = stats.totalDuration > 0 ? Math.round((stats.aiTime / stats.totalDuration) * 100) : 0;
    document.getElementById('ai-percentage').innerText = `${aiPercentage}%`;

    // Update Heatmap (uses all dailyProgress data from DB)
    renderHeatmap();

    // Update Timeline and Files lists
    updateTimelineList(filteredSessions);
    updateFilesList(stats);
  }

  function filterSessionsByRange(sessions, range) {
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

  function aggregateStats(sessions) {
    const stats = {
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

    const todayStr = new Date().toISOString().slice(0, 10);

    sessions.forEach(s => {
      stats.totalDuration += s.duration;
      stats.codingTime += s.codingTime;
      stats.readingTime += s.readingTime;
      stats.debuggingTime += s.debuggingTime;
      stats.terminalTime += s.terminalTime;
      stats.gitTime += s.gitTime;
      stats.testingTime += s.testingTime;
      stats.aiTime += s.aiTime;
      stats.terminalCommandsCount += s.terminalCommands.length;

      // Track today's time specifically for the goal ring
      const sessionDateStr = new Date(s.startTime).toISOString().slice(0, 10);
      if (sessionDateStr === todayStr) {
        stats.todayDuration += s.duration;
      }

      // Aggregate languages
      for (const [lang, sec] of Object.entries(s.languages)) {
        stats.languages[lang] = (stats.languages[lang] || 0) + sec;
      }

      // Aggregate projects
      const proj = s.workspaceName || 'Unknown Project';
      stats.projects[proj] = (stats.projects[proj] || 0) + s.duration;

      // Aggregate files
      for (const [file, fileStats] of Object.entries(s.files)) {
        if (!stats.files[file]) {
          stats.files[file] = {
            fileName: fileStats.fileName,
            relativePath: fileStats.relativePath,
            languageId: fileStats.languageId,
            timeSpent: 0,
            editsCount: 0,
            readsCount: 0
          };
        }
        stats.files[file].timeSpent += fileStats.timeSpent;
        stats.files[file].editsCount += fileStats.editsCount;
        stats.files[file].readsCount += fileStats.readsCount;
      }

      // Gather timeline events
      if (s.timeline) {
        stats.timelineEvents.push(...s.timeline);
      }
    });

    // Sort timeline chronologically descending
    stats.timelineEvents.sort((a, b) => b.timestamp - a.timestamp);

    return stats;
  }

  function updateGoalRing(todaySeconds) {
    const goalSeconds = (activeConfig && activeConfig.dailyGoal) || 14400; // default 4h
    const pct = Math.min(Math.round((todaySeconds / goalSeconds) * 100), 100);
    
    document.getElementById('goal-percentage').innerText = `${pct}%`;
    document.getElementById('goal-progress-text').innerText = `${formatHoursDecimal(todaySeconds)}h / ${formatHoursDecimal(goalSeconds)}h Goal`;

    // Calculate SVG circle dashoffset
    const circle = document.getElementById('goal-progress-ring');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (pct / 100) * circumference;
    circle.strokeDashoffset = offset;
  }

  function updateCategoryBreakdown(stats) {
    const categories = [
      { name: 'Coding', time: stats.codingTime, class: 'coding', color: 'var(--color-coding)' },
      { name: 'Reading', time: stats.readingTime, class: 'reading', color: 'var(--color-reading)' },
      { name: 'Debugging', time: stats.debuggingTime, class: 'debugging', color: 'var(--color-debugging)' },
      { name: 'Terminal', time: stats.terminalTime, class: 'terminal', color: 'var(--color-terminal)' },
      { name: 'Git', time: stats.gitTime, class: 'git', color: 'var(--color-git)' },
      { name: 'Testing', time: stats.testingTime, class: 'testing', color: 'var(--color-testing)' },
      { name: 'AI Assistance', time: stats.aiTime, class: 'ai', color: 'var(--color-ai)' }
    ];

    // Sort categories by time desc
    categories.sort((a, b) => b.time - a.time);

    const list = document.getElementById('category-breakdown-list');
    list.innerHTML = '';

    categories.forEach(cat => {
      if (cat.time === 0) { return; }
      
      const pct = stats.totalDuration > 0 ? Math.round((cat.time / stats.totalDuration) * 100) : 0;
      
      const item = document.createElement('div');
      item.className = 'breakdown-item';
      item.innerHTML = `
        <div class="breakdown-label">
          <div class="color-dot" style="background: ${cat.color};"></div>
          <span>${cat.name}</span>
        </div>
        <div class="breakdown-value">${formatDuration(cat.time)} <span style="color: var(--text-secondary); font-size: 11px; font-weight: normal; margin-left: 4px;">${pct}%</span></div>
      `;
      list.appendChild(item);
    });

    if (list.children.length === 0) {
      list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 14px;">No activity logged yet</div>`;
    }
  }

  function updateLanguagesList(stats) {
    const list = document.getElementById('languages-table-list');
    list.innerHTML = '';

    const langs = Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1]);

    const totalLangTime = langs.reduce((acc, curr) => acc + curr[1], 0);

    langs.forEach(([lang, time]) => {
      const pct = totalLangTime > 0 ? Math.round((time / totalLangTime) * 100) : 0;
      
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <div class="table-row-name">${lang}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${pct}%; background: var(--color-primary);"></div>
        </div>
        <div style="font-size: 13px; font-weight: 600;">${formatDuration(time)} <span style="font-weight: normal; color: var(--text-secondary); font-size: 11px; margin-left: 4px;">${pct}%</span></div>
      `;
      list.appendChild(row);
    });

    if (langs.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 24px 0; color: var(--text-secondary); font-size: 14px;">No language files edited yet</div>`;
    }
  }

  function updateProjectsList(stats) {
    const list = document.getElementById('projects-table-list');
    list.innerHTML = '';

    const projs = Object.entries(stats.projects)
      .sort((a, b) => b[1] - a[1]);

    projs.forEach(([proj, time]) => {
      const pct = stats.totalDuration > 0 ? Math.round((time / stats.totalDuration) * 100) : 0;
      
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <div class="table-row-name">${proj}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${pct}%; background: var(--color-secondary);"></div>
        </div>
        <div style="font-size: 13px; font-weight: 600;">${formatDuration(time)} <span style="font-weight: normal; color: var(--text-secondary); font-size: 11px; margin-left: 4px;">${pct}%</span></div>
      `;
      list.appendChild(row);
    });

    if (projs.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 24px 0; color: var(--text-secondary); font-size: 14px;">No projects tracked yet</div>`;
    }
  }

  function updateFilesList(aggregatedStats = null) {
    const list = document.getElementById('files-table-list');
    if (!list) { return; }

    let stats = aggregatedStats;
    if (!stats) {
      const filtered = filterSessionsByRange(db.sessions, rangeSelect.value);
      stats = aggregateStats(filtered);
    }

    list.innerHTML = '';
    const query = fileSearchInput.value.toLowerCase().trim();

    let files = Object.values(stats.files)
      .sort((a, b) => b.timeSpent - a.timeSpent);

    if (query) {
      files = files.filter(f => f.relativePath.toLowerCase().includes(query) || f.fileName.toLowerCase().includes(query));
    }

    files.forEach(f => {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.style.marginBottom = '6px';
      row.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; overflow: hidden; padding-right: 12px;">
          <div class="table-row-name" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${f.fileName}</div>
          <div style="font-size: 11px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${f.relativePath}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px; min-width: 140px; justify-content: flex-end;">
          <div style="font-size: 11px; color: var(--text-secondary); text-align: right;">📝 ${f.editsCount} / 📖 ${f.readsCount}</div>
          <strong style="font-size: 13px;">${formatDuration(f.timeSpent)}</strong>
        </div>
      `;
      list.appendChild(row);
    });

    if (files.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 24px 0; color: var(--text-secondary); font-size: 14px;">No files match search</div>`;
    }
  }

  function updateTimelineList(sessions) {
    const list = document.getElementById('timeline-list');
    list.innerHTML = '';

    // Collect and sort all timeline events from these sessions
    const events = [];
    sessions.forEach(s => {
      if (s.timeline) {
        s.timeline.forEach(evt => {
          events.push({
            ...evt,
            projectName: s.workspaceName || 'Unknown Project'
          });
        });
      }
    });

    events.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to latest 50 events
    const latestEvents = events.slice(0, 50);

    latestEvents.forEach(evt => {
      const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = new Date(evt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      const item = document.createElement('div');
      item.className = 'timeline-item';
      
      let color = 'var(--color-primary)';
      if (evt.category === 'coding') { color = 'var(--color-coding)'; }
      else if (evt.category === 'reading') { color = 'var(--color-reading)'; }
      else if (evt.category === 'debugging') { color = 'var(--color-debugging)'; }
      else if (evt.category === 'terminal') { color = 'var(--color-terminal)'; }
      else if (evt.category === 'git') { color = 'var(--color-git)'; }
      else if (evt.category === 'testing') { color = 'var(--color-testing)'; }
      else if (evt.category === 'ai') { color = 'var(--color-ai)'; }
      else if (evt.category === 'idle') { color = 'var(--text-secondary)'; }

      item.innerHTML = `
        <div class="timeline-dot" style="background: ${color};"></div>
        <div class="timeline-time">${dateStr} ${timeStr} <span style="color: var(--text-secondary);">(${evt.projectName})</span></div>
        <div class="timeline-desc">${evt.description}</div>
      `;
      list.appendChild(item);
    });

    if (latestEvents.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 24px 0; color: var(--text-secondary); font-size: 14px;">No timeline history recorded</div>`;
    }
  }

  function renderHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    grid.innerHTML = '';

    // Create days array for the last 365 days (53 weeks)
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const daysToShow = 371; // 53 weeks * 7 days
    
    // Start at a Sunday, 53 weeks ago
    const startDate = new Date(now.getTime() - daysToShow * oneDay);
    const dayOfWeek = startDate.getDay();
    // Adjust to align grid rows perfectly with days of week
    const adjustedStartDate = new Date(startDate.getTime() - dayOfWeek * oneDay);

    const tooltip = document.getElementById('tooltip');

    for (let i = 0; i < daysToShow; i++) {
      const currentDate = new Date(adjustedStartDate.getTime() + i * oneDay);
      const dateStr = currentDate.toISOString().slice(0, 10);
      
      const dayData = db.dailyProgress[dateStr];
      const devTime = dayData ? dayData.developmentTime : 0;
      
      let level = 0;
      if (devTime > 0) {
        if (devTime < 1800) { level = 1; }      // < 30 mins
        else if (devTime < 7200) { level = 2; } // < 2 hrs
        else if (devTime < 14400) { level = 3; } // < 4 hrs
        else { level = 4; }                      // >= 4 hrs
      }

      const cell = document.createElement('div');
      cell.className = `heatmap-day level-${level}`;
      
      // Hover listeners for custom tooltip
      cell.addEventListener('mouseenter', (e) => {
        const dateFormatted = currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeFormatted = formatDuration(devTime);
        
        tooltip.innerHTML = `<strong>${dateFormatted}</strong><br>${timeFormatted} logged`;
        tooltip.style.display = 'block';
        
        // Position tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX - 40}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 55}px`;
      });

      cell.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      grid.appendChild(cell);
    }
  }

  // Formatting utilities
  function formatDuration(seconds) {
    if (seconds <= 0 || isNaN(seconds)) { return '0m'; }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  }

  function formatHoursDecimal(seconds) {
    if (seconds <= 0 || isNaN(seconds)) { return '0.0'; }
    return (seconds / 3600).toFixed(1);
  }

  // Initial trigger to fetch data
  vscode.postMessage({ command: 'getData' });

}());
