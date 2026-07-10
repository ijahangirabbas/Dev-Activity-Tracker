'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderGit2, 
  FileText, 
  Terminal, 
  ArrowUpRight, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

export default function DashboardShowcase() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'projects' | 'files' | 'terminals'>('overview');

  return (
    <section id="showcase" className="py-28 px-4 max-w-7xl mx-auto border-t border-border-default relative">
      <div className="absolute top-[10%] right-[10%] w-[450px] h-[450px] bg-accent-primary/5 blur-[120px] pointer-events-none -z-10 animate-pulse" />
      
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary font-sans">
          The Full Command Center
        </h2>
        <p className="mt-4 text-text-secondary text-sm md:text-base leading-relaxed">
          Inspect granular reports of your engineering cycles. Measure focus metrics, track project divisions, and review version control integrations from one unified console.
        </p>
      </div>

      {/* Main Showcase Dashboard Container */}
      <div className="w-full max-w-5xl mx-auto rounded-2xl border border-accent-primary/15 bg-card-bg shadow-2xl dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9),0_0_100px_0_rgba(124,108,255,0.03)] overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Mockup Sidebar */}
        <div className="w-full md:w-56 bg-card-hover-bg/30 border-r border-border-default p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* Header / Brand */}
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-6 h-6 rounded-lg bg-accent-primary flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-white"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-[11px] font-bold tracking-widest text-text-primary uppercase">Dev Console</span>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'projects', label: 'Projects', icon: FolderGit2 },
                { id: 'files', label: 'File Metrics', icon: FileText },
                { id: 'terminals', label: 'Terminals', icon: Terminal },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubTab(item.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeSubTab === item.id
                        ? 'bg-card-hover-bg text-accent-primary border-l-2 border-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-card-hover-bg/50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer User Info Mock */}
          <div className="pt-4 border-t border-border-default flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-[10px] font-bold text-accent-primary">
              JA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-text-primary truncate">Jahangir Abbas</p>
              <p className="text-[8px] text-text-muted truncate font-mono">jahangir@labs.io</p>
            </div>
          </div>
        </div>

        {/* Mockup Workspace Area */}
        <div className="flex-1 p-6 sm:p-8 bg-card-bg/20 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW SCREEN */}
            {activeSubTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-border-default">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Engineering Overview</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Focus rates and developer timelines for the current cycle</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center gap-1.5 uppercase">
                    <Activity size={10} /> Live Monitoring
                  </span>
                </div>

                {/* Micro Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border-default bg-card-hover-bg/30">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted block mb-1">Time Logged Today</span>
                    <span className="text-xl font-bold text-text-primary">5h 48m 12s</span>
                    <div className="flex items-center gap-1 text-[9px] text-accent-green mt-1">
                      <TrendingUp size={10} /> +12% vs last week
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border-default bg-card-hover-bg/30">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted block mb-1">Active Focus Score</span>
                    <span className="text-xl font-bold text-text-primary">92 / 100</span>
                    <div className="h-1 w-full bg-border-default rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-accent-primary" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border-default bg-card-hover-bg/30">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted block mb-1">Git Commits Today</span>
                    <span className="text-xl font-bold text-text-primary">14 Commits</span>
                    <div className="flex items-center gap-1 text-[9px] text-accent-primary mt-1">
                      Mapped to 4 main branches
                    </div>
                  </div>
                </div>

                {/* Graph */}
                <div className="p-4 rounded-xl border border-border-default bg-card-hover-bg/30">
                  <div className="flex justify-between items-center text-[10px] text-text-muted mb-4">
                    <span>Hourly Productivity Allocation</span>
                    <span>July 10, 2026</span>
                  </div>
                  <div className="flex items-end justify-between h-24 pt-2">
                    {[30, 45, 10, 0, 0, 75, 90, 60, 40, 85, 95, 70].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 w-full px-1">
                        <div 
                          className="w-full bg-accent-primary/20 hover:bg-accent-primary/50 rounded-t transition-all duration-300"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[8px] font-mono text-text-muted">{i + 8}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PROJECTS SCREEN */}
            {activeSubTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-border-default">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Project Distribution</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Tracking directory workspace divisions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { path: 'j:\\Projects\\dev-activity-tracker', time: '3h 48m', pct: '65%', subtext: 'Vite app, supabase, VS Code extension logic' },
                    { path: 'j:\\Projects\\personal-portfolio', time: '1h 32m', pct: '26%', subtext: 'React, Tailwind CSS, static assets' },
                    { path: 'j:\\Projects\\llm-agent-sdk', time: '0h 28m', pct: '9%', subtext: 'Rust, WebAssembly components, cargo crates' },
                  ].map(proj => (
                    <div key={proj.path} className="p-4 rounded-xl border border-border-default bg-card-hover-bg/20 hover:border-border-hover transition duration-200 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-text-primary font-mono">{proj.path}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{proj.subtext}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-text-primary">{proj.time}</p>
                          <p className="text-[10px] text-accent-primary font-semibold">{proj.pct}</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-border-default rounded-full overflow-hidden">
                        <div className="h-full bg-accent-primary rounded-full" style={{ width: proj.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FILE METRICS SCREEN */}
            {activeSubTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-border-default">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Granular File Activity</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Top files sorted by keypress actions and active focus cycles</p>
                  </div>
                </div>

                <div className="border border-border-default rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-default bg-card-hover-bg/30 text-text-muted font-bold">
                        <th className="p-3">File Name</th>
                        <th className="p-3">Focus Duration</th>
                        <th className="p-3 text-right">Keystrokes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {[
                        { name: 'src/components/landing/HeroSection.tsx', time: '1h 14m', keypresses: '2,482 keystrokes' },
                        { name: 'src/app/globals.css', time: '48m', keypresses: '1,120 keystrokes' },
                        { name: 'src/components/landing/FeatureGrid.tsx', time: '34m', keypresses: '890 keystrokes' },
                        { name: 'supabase/migrations/users.sql', time: '12m', keypresses: '240 keystrokes' },
                      ].map(file => (
                        <tr key={file.name} className="hover:bg-card-hover-bg/30 text-text-secondary">
                          <td className="p-3 font-mono text-[11px] truncate max-w-xs">{file.name}</td>
                          <td className="p-3">{file.time}</td>
                          <td className="p-3 text-right font-mono font-medium text-text-primary">{file.keypresses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TERMINALS SCREEN */}
            {activeSubTab === 'terminals' && (
              <motion.div
                key="terminals"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-border-default">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Terminal Command Logs</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Aggregated shell commands parsed by action types</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border-default bg-card-hover-bg/20 space-y-3">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Activity breakdown</span>
                    <div className="space-y-2">
                      {[
                        { type: 'Development Server Starts', count: '12 runs', pct: '40%' },
                        { type: 'Package Installs (npm/cargo)', count: '4 runs', pct: '25%' },
                        { type: 'Version Control (git)', count: '28 runs', pct: '20%' },
                        { type: 'Testing (jest/vitest)', count: '6 runs', pct: '15%' },
                      ].map(term => (
                        <div key={term.type} className="text-xs space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-secondary">{term.type}</span>
                            <span className="text-text-primary font-semibold">{term.count}</span>
                          </div>
                          <div className="h-1 bg-border-default rounded-full overflow-hidden">
                            <div className="h-full bg-accent-primary" style={{ width: term.pct }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border-default bg-card-hover-bg/30 font-mono text-[10px] text-text-muted space-y-1.5 overflow-hidden">
                    <span className="text-[10px] font-sans font-bold text-text-muted uppercase tracking-widest block mb-2">Live shell events</span>
                    <div className="text-text-muted/60">[08:14:12] SHELL OPEN - j:\Projects\dev-activity-tracker</div>
                    <div className="text-text-secondary">$ npm run dev</div>
                    <div className="text-text-muted/60">[08:14:14] VITE READY - server running</div>
                    <div className="text-text-muted/60">[08:26:42] GIT DETECT - git status</div>
                    <div className="text-text-secondary">$ git add .</div>
                    <div className="text-text-secondary">$ git commit -m "feat: design overhaul"</div>
                    <div className="text-text-muted/60">[08:27:01] COMMIT SYNC - branch main (da5f18c)</div>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>

          {/* Call-out tip */}
          <div className="mt-8 p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/10 text-[11px] text-accent-primary flex items-center justify-between">
            <span>💡 All tabs and data structures rendered inside this mockup reflect active production layouts.</span>
            <a href="#signup" className="flex items-center gap-1 font-bold hover:underline shrink-0">
              Create an Account <ArrowUpRight size={12} />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
