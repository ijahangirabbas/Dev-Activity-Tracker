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

  // Cloud sync button
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing...';
      vscode.postMessage({ command: 'syncToCloud' });
      setTimeout(() => {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i data-lucide="cloud-upload" style="width:14px;height:14px;"></i> Sync Cloud';
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
      }, 3000);
    });
  }


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

    // Update Terminal & AI Info (Dynamic layout with empty states)
    updateTerminalAIUsage(stats);

    // Update Heatmap (uses all dailyProgress data from DB)
    renderHeatmap();

    // Update Timeline and Files lists
    updateTimelineList(filteredSessions);
    updateFilesList(stats);

    // Re-create Lucide icons for all dynamically injected list items
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
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

    // FIX: use local timezone, not UTC, for date comparison
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
      stats.terminalCommandsCount += s.terminalCommands.length;

      // Track today's time for the goal ring (local timezone)
      const sessionDateStr = localDateStr(new Date(s.startTime));
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
    try {
      const goalSeconds = (activeConfig && activeConfig.dailyGoal) || 14400; // default 4h
      const pct = Math.min(Math.round((todaySeconds / goalSeconds) * 100), 100);
      
      const pctEl = document.getElementById('goal-percentage');
      if (pctEl) { pctEl.innerText = `${pct}%`; }
      
      const txtEl = document.getElementById('goal-progress-text');
      if (txtEl) { txtEl.innerText = `${formatHoursDecimal(todaySeconds)}h / ${formatHoursDecimal(goalSeconds)}h Goal`; }

      // Calculate SVG circle dashoffset safely
      const circle = document.getElementById('goal-progress-ring');
      if (circle) {
        let radius = 50;
        if (circle.r && circle.r.baseVal) {
          radius = circle.r.baseVal.value;
        } else {
          radius = parseFloat(circle.getAttribute('r') || '50');
        }
        const circumference = radius * 2 * Math.PI;
        
        circle.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (pct / 100) * circumference;
        circle.strokeDashoffset = offset;
      }
    } catch (e) {
      console.error('Error updating goal ring:', e);
    }
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
      const pct = stats.totalDuration > 0 ? Math.round((cat.time / stats.totalDuration) * 100) : 0;
      const item = document.createElement('div');
      item.className = 'breakdown-item';
      
      if (cat.time === 0) {
        item.style.opacity = '0.55';
        let emptyNote = 'No activity yet';
        if (cat.class === 'git') {
          emptyNote = 'Start committing to view insights';
        } else if (cat.class === 'terminal') {
          emptyNote = 'Open a terminal session to begin tracking';
        } else if (cat.class === 'ai') {
          emptyNote = 'AI interactions will appear here automatically';
        }
        item.innerHTML = `
          <div class="breakdown-label">
            <div class="color-pill" style="background: var(--text-muted);"></div>
            <span style="color: var(--text-muted);">${cat.name}</span>
          </div>
          <div class="breakdown-value" style="font-size: 11px; font-weight: normal; color: var(--text-muted);">${emptyNote}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="breakdown-label">
            <div class="color-pill" style="background: ${cat.color};"></div>
            <span>${cat.name}</span>
          </div>
          <div class="breakdown-value">${formatDuration(cat.time)} <span style="color: var(--text-secondary); font-size: 11px; font-weight: normal; margin-left: 4px;">${pct}%</span></div>
        `;
      }
      list.appendChild(item);
    });

    if (list.children.length === 0) {
      list.innerHTML = `
        <div class="empty-state-container">
          <div class="empty-state-icon"><i data-lucide="bar-chart-2" style="width:24px;height:24px;"></i></div>
          <div class="empty-state-title">No Activity Yet</div>
          <div class="empty-state-subtitle">Your productivity breakdown will appear here once logged.</div>
        </div>
      `;
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
        <div class="table-row-name" style="display: flex; align-items: center; gap: 8px;">
          <div class="row-icon-container">
            <i data-lucide="code" style="width:12px;height:12px;"></i>
          </div>
          <span>${lang}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${pct}%;"></div>
        </div>
        <div style="font-size: 13px; font-weight: 600;">${formatDuration(time)} <span style="font-weight: normal; color: var(--text-secondary); font-size: 11px; margin-left: 4px;">${pct}%</span></div>
      `;
      list.appendChild(row);
    });

    if (langs.length === 0) {
      list.innerHTML = `
        <div class="empty-state-container">
          <div class="empty-state-icon"><i data-lucide="braces" style="width:24px;height:24px;"></i></div>
          <div class="empty-state-title">No Languages Tracked</div>
          <div class="empty-state-subtitle">Start coding to see language insights.</div>
        </div>
      `;
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
        <div class="table-row-name" style="display: flex; align-items: center; gap: 8px;">
          <div class="row-icon-container">
            <i data-lucide="folder" style="width:12px;height:12px;"></i>
          </div>
          <span>${proj}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${pct}%;"></div>
        </div>
        <div style="font-size: 13px; font-weight: 600;">${formatDuration(time)} <span style="font-weight: normal; color: var(--text-secondary); font-size: 11px; margin-left: 4px;">${pct}%</span></div>
      `;
      list.appendChild(row);
    });

    if (projs.length === 0) {
      list.innerHTML = `
        <div class="empty-state-container">
          <div class="empty-state-icon"><i data-lucide="folder-git-2" style="width:24px;height:24px;"></i></div>
          <div class="empty-state-title">No Workspaces Tracked</div>
          <div class="empty-state-subtitle">Open workspace folders to begin tracking projects.</div>
        </div>
      `;
    }
  }

  function updateTerminalAIUsage(stats) {
    const container = document.querySelector('.terminal-ai-container');
    if (!container) return;

    let terminalHTML = '';
    if (stats.terminalTime === 0 && stats.terminalCommandsCount === 0) {
      terminalHTML = `
        <div class="terminal-ai-section">
          <div class="empty-state-container" style="padding: 16px 8px;">
            <div class="empty-state-icon" style="margin-bottom: 6px; color: var(--color-terminal); opacity: 0.7;"><i data-lucide="terminal" style="width:18px;height:18px;"></i></div>
            <div class="empty-state-title" style="font-size: 12.5px;">No Terminal Usage</div>
            <div class="empty-state-subtitle" style="font-size: 11px;">Open a terminal session to begin tracking.</div>
          </div>
        </div>
      `;
    } else {
      const termTrendIcon = stats.terminalCommandsCount > 0 ? 'trending-up' : 'trending-down';
      const termTrendClass = stats.terminalCommandsCount > 0 ? 'positive' : 'neutral';
      const termTrendText = stats.terminalCommandsCount > 0 ? 'active' : 'stable';
      terminalHTML = `
        <div class="terminal-ai-section">
          <div class="terminal-ai-row">
            <div class="row-label-group">
              <div class="icon-badge terminal-badge">
                <i data-lucide="terminal" style="width:14px;height:14px;"></i>
              </div>
              <span class="usage-label">Terminal Active Time</span>
            </div>
            <div class="row-value-group">
              <span class="pulse-indicator terminal-pulse active-pulse" title="Active" style="background-color: var(--color-terminal); box-shadow: 0 0 8px var(--color-terminal);"></span>
              <strong>${formatDuration(stats.terminalTime)}</strong>
            </div>
          </div>
          <div class="terminal-ai-row secondary-row">
            <span class="usage-sublabel">Commands Executed</span>
            <div class="row-value-group">
              <div class="mini-trend ${termTrendClass}"><i data-lucide="${termTrendIcon}" style="width:10px;height:10px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> ${termTrendText}</div>
              <strong class="muted-metric">${stats.terminalCommandsCount}</strong>
            </div>
          </div>
        </div>
      `;
    }

    let aiHTML = '';
    const aiPercentage = stats.totalDuration > 0 ? Math.round((stats.aiTime / stats.totalDuration) * 100) : 0;
    if (stats.aiTime === 0) {
      aiHTML = `
        <div class="terminal-ai-section">
          <div class="empty-state-container" style="padding: 16px 8px;">
            <div class="empty-state-icon" style="margin-bottom: 6px; color: var(--color-ai); opacity: 0.7;"><i data-lucide="sparkles" style="width:18px;height:18px;"></i></div>
            <div class="empty-state-title" style="font-size: 12.5px;">No AI Activity</div>
            <div class="empty-state-subtitle" style="font-size: 11px;">AI interactions will appear here automatically.</div>
          </div>
        </div>
      `;
    } else {
      aiHTML = `
        <div class="terminal-ai-section">
          <div class="terminal-ai-row">
            <div class="row-label-group">
              <div class="icon-badge ai-badge">
                <i data-lucide="sparkles" style="width:14px;height:14px;"></i>
              </div>
              <span class="usage-label">AI Active Time</span>
            </div>
            <div class="row-value-group">
              <span class="pulse-indicator ai-pulse active-pulse" title="Active" style="background-color: var(--color-ai); box-shadow: 0 0 8px var(--color-ai);"></span>
              <strong>${formatDuration(stats.aiTime)}</strong>
            </div>
          </div>
          <div class="terminal-ai-row secondary-row">
            <span class="usage-sublabel">AI Code Assistance</span>
            <div class="row-value-group">
              <div class="mini-trend positive"><i data-lucide="trending-up" style="width:10px;height:10px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> +${Math.round(aiPercentage * 0.2) || 1}%</div>
              <strong class="muted-metric">${aiPercentage}%</strong>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${terminalHTML}
      <div class="widget-divider"></div>
      ${aiHTML}
    `;
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
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden; padding-right: 12px;">
          <div class="row-icon-container">
            <i data-lucide="file-text" style="width:12px;height:12px;"></i>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden;">
            <div class="table-row-name" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${f.fileName}</div>
            <div style="font-size: 11px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${f.relativePath}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px; min-width: 160px; justify-content: flex-end;">
          <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            <span style="display: flex; align-items: center; gap: 3px;"><i data-lucide="pencil" style="width:10px;height:10px;"></i> ${f.editsCount}</span>
            <span style="display: flex; align-items: center; gap: 3px;"><i data-lucide="book-open" style="width:10px;height:10px;"></i> ${f.readsCount}</span>
          </div>
          <strong style="font-size: 13px; color: var(--text-primary); min-width: 50px; text-align: right;">${formatDuration(f.timeSpent)}</strong>
        </div>
      `;
      list.appendChild(row);
    });

    if (files.length === 0) {
      list.innerHTML = `
        <div class="empty-state-container">
          <div class="empty-state-icon"><i data-lucide="file-warning" style="width:24px;height:24px;"></i></div>
          <div class="empty-state-title">No Matching Files</div>
          <div class="empty-state-subtitle">No files found matching "${query}" in this range.</div>
        </div>
      `;
    }

    // Call lucide trigger since search dynamically inserts icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
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
      const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
        <div class="timeline-dot" style="background: ${color}; box-shadow: 0 0 6px ${color};"></div>
        <div class="timeline-time">${dateStr} ${timeStr} <span style="color: var(--text-secondary);">(${evt.projectName})</span></div>
        <div class="timeline-desc">${evt.description}</div>
      `;
      list.appendChild(item);
    });

    if (latestEvents.length === 0) {
      list.innerHTML = `
        <div class="empty-state-container">
          <div class="empty-state-icon"><i data-lucide="history" style="width:24px;height:24px;"></i></div>
          <div class="empty-state-title">No History Recorded</div>
          <div class="empty-state-subtitle">No timeline events have been logged for this period.</div>
        </div>
      `;
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
      const dateStr = localDateStr(currentDate);
      
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

  // Utility: local-timezone date string (YYYY-MM-DD) to avoid UTC shift bugs
  function localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Initial trigger to fetch data
  vscode.postMessage({ command: 'getData' });

}());
