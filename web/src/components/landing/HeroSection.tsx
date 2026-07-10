'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Terminal, 
  Shield, 
  Zap, 
  FolderOpen, 
  Calendar, 
  GitBranch, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  Code2 
} from 'lucide-react';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'ai' | 'terminal'>('overview');
  const [focusTime, setFocusTime] = useState(13512); // Starts at 3h 45m 12s
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    }, 15000);
    return () => clearInterval(syncInterval);
  }, []);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const heatmapDays = Array.from({ length: 42 }, (_, i) => {
    const levels = [0, 1, 2, 3, 4];
    if (i % 7 === 0 || i % 7 === 6) return 0;
    if (i === 15 || i === 22 || i === 33) return 4;
    return levels[Math.floor(Math.sin(i) * 2) + 2] || 1;
  });

  return (
    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 flex flex-col items-center justify-center text-center px-4 max-w-7xl mx-auto">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-accent-primary/10 via-accent-purple/5 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-[15%] right-[10%] w-[350px] h-[350px] bg-accent-cyan/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Floating Announcement Badge */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border-default bg-card-bg text-xs font-semibold text-text-secondary mb-6 shadow-sm dark:shadow-md hover:border-border-hover transition-colors"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary/75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
        </span>
        <span className="text-text-secondary">✨ Version 1.0.0 Now Available</span>
        <span className="h-3 w-px bg-border-default" />
        <span className="flex items-center gap-1 text-accent-primary hover:text-accent-primary-hover transition-colors">
          One-click Install <ArrowRight size={10} />
        </span>
      </motion.div>

      {/* Main Hero Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-5xl leading-[1.05] text-gradient font-sans"
      >
        Know Exactly Where Your
        <span className="block mt-2 bg-gradient-to-r from-accent-primary via-accent-purple to-accent-cyan bg-clip-text text-transparent">
          Coding Time Goes.
        </span>
      </motion.h1>

      {/* Value badges */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="mt-6 text-xs sm:text-sm text-text-secondary uppercase tracking-widest font-extrabold flex flex-wrap justify-center gap-3 sm:gap-6 text-center"
      >
        <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent-primary" /> No Manual Timers</span>
        <span className="hidden sm:inline text-border-default">•</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent-purple" /> Fully Automatic</span>
        <span className="hidden sm:inline text-border-default">•</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent-cyan" /> Private By Default</span>
      </motion.p>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        className="mt-6 text-text-body max-w-2xl text-sm sm:text-base leading-relaxed"
      >
        A secure, local-first VS Code extension that silently maps your development metrics in the background. Tracks files, terminals, Git branches, and AI copilot usage without exporting a single line of raw code.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="mt-8 flex flex-row gap-4 justify-center items-center w-full max-w-lg px-4 flex-wrap"
      >
        <Link
          to="/signup"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary text-white font-bold text-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer shrink-0"
        >
          Get Started For Free
          <ArrowRight size={16} />
        </Link>
        <a
          href="https://github.com/ijahangirabbas/Dev-Activity-Tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-border-default bg-card-bg hover:bg-card-hover-bg font-bold text-xs text-text-secondary hover:text-text-primary transition-all duration-300 hover:border-border-hover cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5 text-accent-primary" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clipRule="evenodd" /></svg>
          <span>Star GitHub</span>
          <span className="px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-[9px]">1.2k+</span>
        </a>
      </motion.div>

      {/* Interactive Mockup Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="mt-14 w-full max-w-5xl rounded-2xl border border-border-default bg-card-bg shadow-xl dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9),0_0_100px_0_rgba(124,108,255,0.03)] overflow-hidden relative group"
      >
        <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, rgba(124,108,255,0.01) 0%, transparent 100%) pointer-events-none" />

        {/* Mockup Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-card-hover-bg border-b border-border-default gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
            </div>
            <span className="h-4 w-px bg-border-default hidden sm:inline" />
            <span className="text-[11px] font-mono text-text-muted select-none truncate">
              ~/.vscode/extensions/dev-activity-tracker
            </span>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex gap-1.5 rounded-xl bg-card-bg p-1 border border-border-default shrink-0">
            {[
              { id: 'overview', label: 'Overview', icon: Code2 },
              { id: 'activity', label: 'Git Sync', icon: GitBranch },
              { id: 'ai', label: 'AI Multiplier', icon: Cpu },
              { id: 'terminal', label: 'Live Shell', icon: Terminal },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer select-none ${
                    activeTab === tab.id
                      ? 'bg-card-hover-bg text-accent-primary border border-border-hover shadow-sm dark:shadow-none'
                      : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mockup Content Sandbox */}
        <div className="p-8 bg-card-bg/20 min-h-[300px] flex flex-col justify-between text-left">
          
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Stats Card 1 */}
                <div className="p-5 rounded-xl border border-border-default bg-card-bg hover:border-border-hover transition duration-300 relative overflow-hidden shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Active State</span>
                    <Zap size={14} className="text-accent-primary animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary">💻 Active Coding</div>
                  <div className="text-xs text-accent-primary/80 mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-ping" />
                    Keypresses detected 42s ago
                  </div>
                </div>

                {/* Stats Card 2 */}
                <div className="p-5 rounded-xl border border-border-default bg-card-bg hover:border-border-hover transition duration-300 relative overflow-hidden shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Today's Session</span>
                    <Clock size={14} className="text-accent-purple" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary font-mono tracking-tight tabular-nums">
                    {formatTime(focusTime)}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    Goal: 78.4% of 5h daily target
                  </div>
                </div>

                {/* Stats Card 3 */}
                <div className="p-5 rounded-xl border border-border-default bg-card-bg hover:border-border-hover transition duration-300 relative overflow-hidden shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Privacy Status</span>
                    <Shield size={14} className="text-accent-cyan" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary">🔒 Vault Mode</div>
                  <div className="text-xs text-accent-cyan/80 mt-1">
                    Files fully hashed locally
                  </div>
                </div>

                {/* Heatmap */}
                <div className="md:col-span-2 p-5 rounded-xl border border-border-default bg-card-bg flex flex-col justify-between shadow-sm dark:shadow-none">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Recent Activity Heatmap</span>
                    <span className="text-[10px] text-text-muted">Last 6 weeks</span>
                  </div>
                  <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full overflow-x-auto py-1">
                    {heatmapDays.map((level, i) => (
                      <div 
                        key={i} 
                        className={`w-3.5 h-3.5 rounded transition-all duration-500 hover:scale-110 level-${level}`}
                        title={`Activity level: ${level}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-muted mt-3 pt-2 border-t border-border-default">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded level-0" />
                      <div className="w-2.5 h-2.5 rounded level-1" />
                      <div className="w-2.5 h-2.5 rounded level-2" />
                      <div className="w-2.5 h-2.5 rounded level-3" />
                      <div className="w-2.5 h-2.5 rounded level-4" />
                    </div>
                    <span>More</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="p-5 rounded-xl border border-border-default bg-card-bg flex flex-col justify-between shadow-sm dark:shadow-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Languages</span>
                  <div className="space-y-2">
                    {[
                      { name: 'TypeScript', pct: '62%', color: 'bg-accent-primary' },
                      { name: 'React (TSX)', pct: '24%', color: 'bg-accent-cyan' },
                      { name: 'JSON & YAML', pct: '8%', color: 'bg-accent-amber' },
                      { name: 'Rust', pct: '6%', color: 'bg-accent-red' },
                    ].map(lang => (
                      <div key={lang.name} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-secondary">{lang.name}</span>
                          <span className="text-text-primary font-semibold">{lang.pct}</span>
                        </div>
                        <div className="h-1 bg-border-default rounded-full overflow-hidden">
                          <div className={`h-full ${lang.color}`} style={{ width: lang.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* GIT SYNC TAB */}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center text-xs font-semibold text-text-muted pb-2 border-b border-border-default">
                  <span>Git Branch Commit Mapping</span>
                  <span className="flex items-center gap-1.5"><GitBranch size={12} /> main</span>
                </div>
                <div className="space-y-3 font-mono text-xs max-h-[220px] overflow-y-auto pr-2">
                  {[
                    { commit: 'da21fa9', msg: 'feat: add automated AI token multiplier metrics', time: '14 mins ago', branch: 'main' },
                    { commit: 'bf59e12', msg: 'refactor: isolate db daemon from main loop thread', time: '2 hours ago', branch: 'main' },
                    { commit: '09a12c4', msg: 'fix: debounce focus timer triggers on mouse scroll', time: '5 hours ago', branch: 'main' },
                    { commit: 'e6371a5', msg: 'feat: integrate Supabase client offline sync logic', time: 'Yesterday', branch: 'feat/supabase-sync' },
                  ].map((git) => (
                    <div key={git.commit} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border-default bg-card-bg hover:border-border-hover transition-all gap-2 shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-3">
                        <span className="text-accent-primary font-bold hover:underline cursor-pointer">{git.commit}</span>
                        <span className="text-text-body font-medium truncate">{git.msg}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-card-hover-bg border border-border-default text-[9px] text-text-muted">{git.branch}</span>
                        <span className="text-text-muted text-[10px]">{git.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI MULTIPLIER TAB */}
            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="p-5 rounded-xl border border-border-default bg-card-bg shadow-sm dark:shadow-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Copilot / Cline Invocations</span>
                  <span className="text-3xl font-extrabold text-text-primary">842</span>
                  <span className="text-[10px] text-accent-primary block mt-2">✨ 34% active helper involvement</span>
                </div>
                <div className="p-5 rounded-xl border border-border-default bg-card-bg shadow-sm dark:shadow-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Estimated Hours Saved</span>
                  <span className="text-3xl font-extrabold text-text-primary">14.6 hrs</span>
                  <span className="text-[10px] text-accent-purple block mt-2">Calculated from prompt conversions</span>
                </div>
                <div className="p-5 rounded-xl border border-border-default bg-card-bg shadow-sm dark:shadow-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">AI Productivity Factor</span>
                  <span className="text-3xl font-extrabold text-text-primary">1.42x</span>
                  <span className="text-[10px] text-accent-cyan block mt-2">Compared to baseline manual editing</span>
                </div>
                <div className="md:col-span-3 p-4 rounded-lg bg-card-bg/50 border border-border-default text-xs leading-relaxed text-text-secondary flex items-start gap-3">
                  <Cpu size={18} className="text-accent-primary shrink-0 mt-0.5" />
                  <span>
                    Our tracking engine integrates with editor hooks to monitor command payloads sent to AI extensions. We parse tokens generated to evaluate how much boilerplate code was generated vs typed by hand.
                  </span>
                </div>
              </motion.div>
            )}

            {/* LIVE TERMINAL TAB */}
            {activeTab === 'terminal' && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="font-mono text-xs text-text-body space-y-2 p-5 bg-card-hover-bg/85 border border-border-default rounded-xl max-h-[220px] overflow-y-auto shadow-inner">
                  <div className="text-text-muted">// Dev Activity daemon syncing live terminal execution...</div>
                  <div className="flex gap-2.5">
                    <span className="text-accent-primary select-none">$</span>
                    <span className="text-text-primary font-medium">npm run dev</span>
                  </div>
                  <div className="text-text-secondary">  vite v5.4.21 ready in 234 ms</div>
                  <div className="text-text-muted">  ✓ 42 modules transformed.</div>
                  <div className="text-accent-primary/80">  dist/index.html                     1.24 kB │ gzip:  0.42 kB</div>
                  <div className="text-accent-primary/80">  dist/assets/index-D789AC.js        244.52 kB │ gzip: 82.12 kB</div>
                  <div className="text-accent-primary/80">  dist/assets/index-C89EAF.css        45.24 kB │ gzip: 10.42 kB</div>
                  <div className="text-accent-green">  ✓ built in 1.48s</div>
                  <div className="flex gap-2.5">
                    <span className="text-accent-primary select-none">$</span>
                    <span className="text-text-primary font-medium">vitest run --coverage</span>
                  </div>
                  <div className="text-accent-green">  ✓ All tests passed (12/12)</div>
                  <div className="flex gap-2.5 animate-pulse">
                    <span className="text-accent-primary select-none">$</span>
                    <span className="text-text-primary font-medium">_</span>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>

          {/* Sync indicator */}
          <div className="mt-6 pt-4 border-t border-border-default flex items-center justify-between text-[10px] text-text-muted">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-accent-primary animate-ping' : 'bg-accent-primary'}`} />
              <span>{isSyncing ? 'Syncing cache to DB cloud...' : 'All tracked logs saved locally'}</span>
            </div>
            <span className="font-mono">DB size: 48.2 KB (14 sessions)</span>
          </div>

        </div>
      </motion.div>

    </section>
  );
}
