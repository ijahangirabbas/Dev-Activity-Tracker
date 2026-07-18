(function() {
  const vscode = acquireVsCodeApi();
  let db = null;
  let activeConfig = null;

  // DOM builder helpers for safe rendering without innerHTML
  function el(tag, className, text, children) {
    const element = document.createElement(tag);
    if (className) {
      className.split(' ').forEach(c => {
        if (c.trim()) element.classList.add(c.trim());
      });
    }
    if (text !== undefined && text !== null) {
      element.textContent = text;
    }
    if (children) {
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (child) element.appendChild(child);
        });
      } else {
        element.appendChild(children);
      }
    }
    return element;
  }

  function makeIcon(name, style = {}) {
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', name);
    Object.assign(icon.style, style);
    return icon;
  }

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
        syncBtn.innerText = '';
        syncBtn.appendChild(makeIcon('cloud-upload', { width: '14px', height: '14px' }));
        syncBtn.appendChild(document.createTextNode(' Sync Cloud'));
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

    // Update Goal Completion (P1: Yesterday active hours calculation fix)
    if (range === 'today' || range === 'yesterday') {
      updateGoalRing(stats.totalDuration);
    } else {
      const todaySessions = filterSessionsByRange(db.sessions, 'today');
      const todayStats = aggregateStats(todaySessions);
      updateGoalRing(todayStats.totalDuration);
    }

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
    list.innerText = '';

    categories.forEach(cat => {
      const pct = stats.totalDuration > 0 ? Math.round((cat.time / stats.totalDuration) * 100) : 0;
      const item = el('div', 'breakdown-item');
      
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
        
        const pill = el('div', 'color-pill');
        pill.style.background = 'var(--text-muted)';
        
        const labelSpan = el('span', null, cat.name);
        labelSpan.style.color = 'var(--text-muted)';
        
        const labelDiv = el('div', 'breakdown-label', null, [pill, labelSpan]);
        const valDiv = el('div', 'breakdown-value', emptyNote);
        valDiv.style.fontSize = '11px';
        valDiv.style.fontWeight = 'normal';
        valDiv.style.color = 'var(--text-muted)';
        
        item.appendChild(labelDiv);
        item.appendChild(valDiv);
      } else {
        const pill = el('div', 'color-pill');
        pill.style.background = cat.color;
        
        const labelDiv = el('div', 'breakdown-label', null, [pill, el('span', null, cat.name)]);
        
        const pctSpan = el('span', null, ` ${pct}%`);
        pctSpan.style.color = 'var(--text-secondary)';
        pctSpan.style.fontSize = '11px';
        pctSpan.style.fontWeight = 'normal';
        pctSpan.style.marginLeft = '4px';
        
        const valDiv = el('div', 'breakdown-value', formatDuration(cat.time), pctSpan);
        
        item.appendChild(labelDiv);
        item.appendChild(valDiv);
      }
      list.appendChild(item);
    });

    if (list.children.length === 0) {
      const icon = makeIcon('bar-chart-2', { width: '24px', height: '24px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      const titleDiv = el('div', 'empty-state-title', 'No Activity Yet');
      const subtitleDiv = el('div', 'empty-state-subtitle', 'Your productivity breakdown will appear here once logged.');
      const container = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      list.appendChild(container);
    }
  }

  function updateLanguagesList(stats) {
    const list = document.getElementById('languages-table-list');
    list.innerText = '';

    const langs = Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1]);

    const totalLangTime = langs.reduce((acc, curr) => acc + curr[1], 0);

    langs.forEach(([lang, time]) => {
      const pct = totalLangTime > 0 ? Math.round((time / totalLangTime) * 100) : 0;
      
      const rowIcon = makeIcon('code', { width: '12px', height: '12px' });
      const iconContainer = el('div', 'row-icon-container', null, rowIcon);
      const nameDiv = el('div', 'table-row-name', null, [iconContainer, el('span', null, lang)]);
      nameDiv.style.display = 'flex';
      nameDiv.style.alignItems = 'center';
      nameDiv.style.gap = '8px';

      const bar = el('div', 'progress-bar');
      bar.style.width = `${pct}%`;
      const barContainer = el('div', 'progress-bar-container', null, bar);

      const pctSpan = el('span', null, ` ${pct}%`);
      pctSpan.style.fontWeight = 'normal';
      pctSpan.style.color = 'var(--text-secondary)';
      pctSpan.style.fontSize = '11px';
      pctSpan.style.marginLeft = '4px';

      const durationDiv = el('div', null, formatDuration(time), pctSpan);
      durationDiv.style.fontSize = '13px';
      durationDiv.style.fontWeight = '600';

      const row = el('div', 'table-row', null, [nameDiv, barContainer, durationDiv]);
      list.appendChild(row);
    });

    if (langs.length === 0) {
      const icon = makeIcon('braces', { width: '24px', height: '24px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      const titleDiv = el('div', 'empty-state-title', 'No Languages Tracked');
      const subtitleDiv = el('div', 'empty-state-subtitle', 'Start coding to see language insights.');
      const container = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      list.appendChild(container);
    }
  }

  function updateProjectsList(stats) {
    const list = document.getElementById('projects-table-list');
    list.innerText = '';

    const projs = Object.entries(stats.projects)
      .sort((a, b) => b[1] - a[1]);

    projs.forEach(([proj, time]) => {
      const pct = stats.totalDuration > 0 ? Math.round((time / stats.totalDuration) * 100) : 0;
      
      const rowIcon = makeIcon('folder', { width: '12px', height: '12px' });
      const iconContainer = el('div', 'row-icon-container', null, rowIcon);
      const nameDiv = el('div', 'table-row-name', null, [iconContainer, el('span', null, proj)]);
      nameDiv.style.display = 'flex';
      nameDiv.style.alignItems = 'center';
      nameDiv.style.gap = '8px';

      const bar = el('div', 'progress-bar');
      bar.style.width = `${pct}%`;
      const barContainer = el('div', 'progress-bar-container', null, bar);

      const pctSpan = el('span', null, ` ${pct}%`);
      pctSpan.style.fontWeight = 'normal';
      pctSpan.style.color = 'var(--text-secondary)';
      pctSpan.style.fontSize = '11px';
      pctSpan.style.marginLeft = '4px';

      const durationDiv = el('div', null, formatDuration(time), pctSpan);
      durationDiv.style.fontSize = '13px';
      durationDiv.style.fontWeight = '600';

      const row = el('div', 'table-row', null, [nameDiv, barContainer, durationDiv]);
      list.appendChild(row);
    });

    if (projs.length === 0) {
      const icon = makeIcon('folder-git-2', { width: '24px', height: '24px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      const titleDiv = el('div', 'empty-state-title', 'No Workspaces Tracked');
      const subtitleDiv = el('div', 'empty-state-subtitle', 'Open workspace folders to begin tracking projects.');
      const container = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      list.appendChild(container);
    }
  }

  function updateTerminalAIUsage(stats) {
    const container = document.querySelector('.terminal-ai-container');
    if (!container) return;
    container.innerText = '';

    let terminalSection;
    if (stats.terminalTime === 0 && stats.terminalCommandsCount === 0) {
      const icon = makeIcon('terminal', { width: '18px', height: '18px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      iconDiv.style.marginBottom = '6px';
      iconDiv.style.color = 'var(--color-terminal)';
      iconDiv.style.opacity = '0.7';
      const titleDiv = el('div', 'empty-state-title', 'No Terminal Usage');
      titleDiv.style.fontSize = '12.5px';
      const subtitleDiv = el('div', 'empty-state-subtitle', 'Open a terminal session to begin tracking.');
      subtitleDiv.style.fontSize = '11px';

      const emptyContainer = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      emptyContainer.style.padding = '16px 8px';
      
      terminalSection = el('div', 'terminal-ai-section', null, emptyContainer);
    } else {
      const termIcon = makeIcon('terminal', { width: '14px', height: '14px' });
      const termBadge = el('div', 'icon-badge terminal-badge', null, termIcon);
      const labelSpan = el('span', 'usage-label', 'Terminal Active Time');
      const labelGroup = el('div', 'row-label-group', null, [termBadge, labelSpan]);

      const pulse = el('span', 'pulse-indicator terminal-pulse active-pulse');
      pulse.setAttribute('title', 'Active');
      pulse.style.backgroundColor = 'var(--color-terminal)';
      pulse.style.boxShadow = '0 0 8px var(--color-terminal)';
      const durationVal = el('strong', null, formatDuration(stats.terminalTime));
      const valGroup = el('div', 'row-value-group', null, [pulse, durationVal]);
      const row1 = el('div', 'terminal-ai-row', null, [labelGroup, valGroup]);

      const termTrendIconName = stats.terminalCommandsCount > 0 ? 'trending-up' : 'trending-down';
      const termTrendClass = stats.terminalCommandsCount > 0 ? 'positive' : 'neutral';
      const termTrendText = stats.terminalCommandsCount > 0 ? 'active' : 'stable';
      const trendIcon = makeIcon(termTrendIconName, { width: '10px', height: '10px', display: 'inline-block', verticalAlign: 'middle', marginRight: '2px' });
      const trendDiv = el('div', `mini-trend ${termTrendClass}`, null, [trendIcon, document.createTextNode(` ${termTrendText}`)]);

      const cmdVal = el('strong', 'muted-metric', stats.terminalCommandsCount.toString());
      const valGroup2 = el('div', 'row-value-group', null, [trendDiv, cmdVal]);

      const row2 = el('div', 'terminal-ai-row secondary-row', null, [el('span', 'usage-sublabel', 'Commands Executed'), valGroup2]);

      terminalSection = el('div', 'terminal-ai-section', null, [row1, row2]);
    }

    let aiSection;
    const aiPercentage = stats.totalDuration > 0 ? Math.round((stats.aiTime / stats.totalDuration) * 100) : 0;
    if (stats.aiTime === 0) {
      const icon = makeIcon('sparkles', { width: '18px', height: '18px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      iconDiv.style.marginBottom = '6px';
      iconDiv.style.color = 'var(--color-ai)';
      iconDiv.style.opacity = '0.7';
      const titleDiv = el('div', 'empty-state-title', 'No AI Activity');
      titleDiv.style.fontSize = '12.5px';
      const subtitleDiv = el('div', 'empty-state-subtitle', 'AI interactions will appear here automatically.');
      subtitleDiv.style.fontSize = '11px';

      const emptyContainer = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      emptyContainer.style.padding = '16px 8px';
      
      aiSection = el('div', 'terminal-ai-section', null, emptyContainer);
    } else {
      const aiIcon = makeIcon('sparkles', { width: '14px', height: '14px' });
      const aiBadge = el('div', 'icon-badge ai-badge', null, aiIcon);
      const labelSpan = el('span', 'usage-label', 'AI Active Time');
      const labelGroup = el('div', 'row-label-group', null, [aiBadge, labelSpan]);

      const pulse = el('span', 'pulse-indicator ai-pulse active-pulse');
      pulse.setAttribute('title', 'Active');
      pulse.style.backgroundColor = 'var(--color-ai)';
      pulse.style.boxShadow = '0 0 8px var(--color-ai)';
      const durationVal = el('strong', null, formatDuration(stats.aiTime));
      const valGroup = el('div', 'row-value-group', null, [pulse, durationVal]);
      const row1 = el('div', 'terminal-ai-row', null, [labelGroup, valGroup]);

      const trendIcon = makeIcon('trending-up', { width: '10px', height: '10px', display: 'inline-block', verticalAlign: 'middle', marginRight: '2px' });
      const trendDiv = el('div', 'mini-trend positive', null, [trendIcon, document.createTextNode(` +${Math.round(aiPercentage * 0.2) || 1}%`)]);

      const aiVal = el('strong', 'muted-metric', `${aiPercentage}%`);
      const valGroup2 = el('div', 'row-value-group', null, [trendDiv, aiVal]);

      const row2 = el('div', 'terminal-ai-row secondary-row', null, [el('span', 'usage-sublabel', 'AI Code Assistance'), valGroup2]);

      aiSection = el('div', 'terminal-ai-section', null, [row1, row2]);
    }

    const divider = el('div', 'widget-divider');
    container.appendChild(terminalSection);
    container.appendChild(divider);
    container.appendChild(aiSection);
  }

  function updateFilesList(aggregatedStats = null) {
    const list = document.getElementById('files-table-list');
    if (!list) { return; }

    let stats = aggregatedStats;
    if (!stats) {
      const filtered = filterSessionsByRange(db.sessions, rangeSelect.value);
      stats = aggregateStats(filtered);
    }

    list.innerText = '';
    const query = fileSearchInput.value.toLowerCase().trim();

    let files = Object.values(stats.files)
      .sort((a, b) => b.timeSpent - a.timeSpent);

    if (query) {
      files = files.filter(f => f.relativePath.toLowerCase().includes(query) || f.fileName.toLowerCase().includes(query));
    }

    files.forEach(f => {
      const row = el('div', 'table-row');
      row.style.marginBottom = '6px';
      
      const fileIcon = makeIcon('file-text', { width: '12px', height: '12px' });
      const iconContainer = el('div', 'row-icon-container', null, fileIcon);
      const nameDiv = el('div', 'table-row-name', f.fileName);
      nameDiv.style.textOverflow = 'ellipsis';
      nameDiv.style.overflow = 'hidden';
      nameDiv.style.whiteSpace = 'nowrap';
      
      const relPathDiv = el('div', null, f.relativePath);
      relPathDiv.style.fontSize = '11px';
      relPathDiv.style.color = 'var(--text-secondary)';
      relPathDiv.style.textOverflow = 'ellipsis';
      relPathDiv.style.overflow = 'hidden';
      relPathDiv.style.whiteSpace = 'nowrap';

      const detailsDiv = el('div', null, null, [nameDiv, relPathDiv]);
      detailsDiv.style.display = 'flex';
      detailsDiv.style.flexDirection = 'column';
      detailsDiv.style.gap = '2px';
      detailsDiv.style.overflow = 'hidden';

      const leftCol = el('div', null, null, [iconContainer, detailsDiv]);
      leftCol.style.display = 'flex';
      leftCol.style.alignItems = 'center';
      leftCol.style.gap = '10px';
      leftCol.style.flex = '1';
      leftCol.style.overflow = 'hidden';
      leftCol.style.paddingRight = '12px';

      const editIcon = makeIcon('pencil', { width: '10px', height: '10px' });
      const editSpan = el('span', null, null, [editIcon, document.createTextNode(` ${f.editsCount}`)]);
      editSpan.style.display = 'flex';
      editSpan.style.alignItems = 'center';
      editSpan.style.gap = '3px';

      const readIcon = makeIcon('book-open', { width: '10px', height: '10px' });
      const readSpan = el('span', null, null, [readIcon, document.createTextNode(` ${f.readsCount}`)]);
      readSpan.style.display = 'flex';
      readSpan.style.alignItems = 'center';
      readSpan.style.gap = '3px';

      const countsDiv = el('div', null, null, [editSpan, readSpan]);
      countsDiv.style.fontSize = '11px';
      countsDiv.style.color = 'var(--text-secondary)';
      countsDiv.style.display = 'flex';
      countsDiv.style.alignItems = 'center';
      countsDiv.style.gap = '8px';

      const durationStr = el('strong', null, formatDuration(f.timeSpent));
      durationStr.style.fontSize = '13px';
      durationStr.style.color = 'var(--text-primary)';
      durationStr.style.minWidth = '50px';
      durationStr.style.textAlign = 'right';

      const rightCol = el('div', null, null, [countsDiv, durationStr]);
      rightCol.style.display = 'flex';
      rightCol.style.alignItems = 'center';
      rightCol.style.gap = '16px';
      rightCol.style.minWidth = '160px';
      rightCol.style.justifyContent = 'flex-end';

      row.appendChild(leftCol);
      row.appendChild(rightCol);
      list.appendChild(row);
    });

    if (files.length === 0) {
      const icon = makeIcon('file-warning', { width: '24px', height: '24px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      const titleDiv = el('div', 'empty-state-title', 'No Matching Files');
      const subtitleDiv = el('div', 'empty-state-subtitle', `No files found matching "${query}" in this range.`);
      const container = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      list.appendChild(container);
    }

    // Call lucide trigger since search dynamically inserts icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function updateTimelineList(sessions) {
    const list = document.getElementById('timeline-list');
    list.innerText = '';

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
      
      const item = el('div', 'timeline-item');
      
      let color = 'var(--color-primary)';
      if (evt.category === 'coding') { color = 'var(--color-coding)'; }
      else if (evt.category === 'reading') { color = 'var(--color-reading)'; }
      else if (evt.category === 'debugging') { color = 'var(--color-debugging)'; }
      else if (evt.category === 'terminal') { color = 'var(--color-terminal)'; }
      else if (evt.category === 'git') { color = 'var(--color-git)'; }
      else if (evt.category === 'testing') { color = 'var(--color-testing)'; }
      else if (evt.category === 'ai') { color = 'var(--color-ai)'; }
      else if (evt.category === 'idle') { color = 'var(--text-secondary)'; }

      const dot = el('div', 'timeline-dot');
      dot.style.background = color;
      dot.style.boxShadow = `0 0 6px ${color}`;

      const projSpan = el('span', null, `(${evt.projectName})`);
      projSpan.style.color = 'var(--text-secondary)';
      const timeDiv = el('div', 'timeline-time', `${dateStr} ${timeStr} `, projSpan);

      const descDiv = el('div', 'timeline-desc', evt.description);

      item.appendChild(dot);
      item.appendChild(timeDiv);
      item.appendChild(descDiv);
      list.appendChild(item);
    });

    if (latestEvents.length === 0) {
      const icon = makeIcon('history', { width: '24px', height: '24px' });
      const iconDiv = el('div', 'empty-state-icon', null, icon);
      const titleDiv = el('div', 'empty-state-title', 'No History Recorded');
      const subtitleDiv = el('div', 'empty-state-subtitle', 'No timeline events have been logged for this period.');
      const container = el('div', 'empty-state-container', null, [iconDiv, titleDiv, subtitleDiv]);
      list.appendChild(container);
    }
  }

  function renderHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    grid.innerText = '';

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

      const cell = el('div', `heatmap-day level-${level}`);
      
      // Hover listeners for custom tooltip
      cell.addEventListener('mouseenter', (e) => {
        const dateFormatted = currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeFormatted = formatDuration(devTime);
        
        tooltip.innerText = '';
        tooltip.appendChild(el('strong', null, dateFormatted));
        tooltip.appendChild(document.createElement('br'));
        tooltip.appendChild(document.createTextNode(`${timeFormatted} logged`));
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
