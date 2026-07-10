'use client';

import React, { useMemo } from 'react';
import { useSessions } from 'web/hooks/useSessions';
import { aggregateStats } from 'web/lib/dataHelpers';
import { Terminal, Sparkles, Command } from 'lucide-react';

export default function TerminalsPage() {
  const { data: sessions, isLoading } = useSessions();

  // Aggregate stats
  const stats = useMemo(() => {
    if (!sessions) return null;
    return aggregateStats(sessions);
  }, [sessions]);

  // Aggregate all terminal command events chronologically
  const commandsLog = useMemo(() => {
    if (!sessions) return [];
    
    const cmds: any[] = [];
    sessions.forEach(s => {
      if (s.terminalCommands) {
        s.terminalCommands.forEach(c => {
          cmds.push({
            ...c,
            projectName: s.workspaceName || 'Unknown Project'
          });
        });
      }
    });

    return cmds.sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions]);

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex flex-col gap-6 py-4 animate-pulse">
        <div className="h-8 w-48 bg-border-default rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-card-bg/60 border border-card-border rounded-2xl" />
          <div className="h-44 bg-card-bg/60 border border-card-border rounded-2xl" />
        </div>
        <div className="h-96 bg-card-bg/60 border border-card-border rounded-2xl" />
      </div>
    );
  }

  const formatHrs = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Group commands by category to count distribution
  const categoryCounts = commandsLog.reduce((acc, curr) => {
    const cat = curr.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commandCategories = [
    { key: 'dev', name: 'Dev Server', color: 'text-accent-primary', bgColor: 'bg-accent-primary/10' },
    { key: 'git', name: 'Git Operations', color: 'text-accent-orange', bgColor: 'bg-accent-orange/10' },
    { key: 'package-manager', name: 'Dependencies', color: 'text-accent-red', bgColor: 'bg-accent-red/10' },
    { key: 'build', name: 'Compilation & Build', color: 'text-accent-cyan', bgColor: 'bg-accent-cyan/10' },
    { key: 'test', name: 'Testing Commands', color: 'text-accent-green', bgColor: 'bg-accent-green/10' },
    { key: 'docker', name: 'Containers & Docker', color: 'text-accent-blue', bgColor: 'bg-accent-blue/10' },
    { key: 'other', name: 'Miscellaneous', color: 'text-text-muted', bgColor: 'bg-card-hover-bg' },
  ];

  const aiPercentage = stats.totalDuration > 0 ? Math.round((stats.aiTime / stats.totalDuration) * 100) : 0;

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary">Terminals & AI</h1>
        <p className="text-xs text-text-secondary mt-1">Analytics of shell execution queries and AI tool usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Terminal Overview Card */}
        <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/5 blur-[40px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Terminal Analytics</h3>
              <div className="text-2xl md:text-3xl font-serif font-bold text-text-primary mt-2">{formatHrs(stats.terminalTime)}</div>
              <p className="text-xs text-text-secondary mt-1">Shell activity evaluation active time</p>
            </div>
            <div className="p-3 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green">
              <Terminal size={20} />
            </div>
          </div>
          <div className="pt-4 border-t border-border-default flex justify-between text-xs text-text-secondary font-semibold">
            <span>Total Commands Run</span>
            <span className="text-text-primary font-bold">{stats.terminalCommandsCount}</span>
          </div>
        </div>

        {/* AI Overview Card */}
        <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/5 blur-[40px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">AI Copilot Companion</h3>
              <div className="text-2xl md:text-3xl font-serif font-bold text-text-primary mt-2">{formatHrs(stats.aiTime)}</div>
              <p className="text-xs text-text-secondary mt-1">AI commands evaluation active time</p>
            </div>
            <div className="p-3 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="pt-4 border-t border-border-default flex justify-between text-xs text-text-secondary font-semibold">
            <span>AI Code Assistance Ratio</span>
            <span className="text-text-primary font-bold">{aiPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Command categories breakdown */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card space-y-4">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Command Types Distribution</h3>
          <div className="space-y-3.5 pt-2">
            {commandCategories.map(cat => {
              const count = categoryCounts[cat.key] || 0;
              const pct = stats.terminalCommandsCount > 0 ? Math.round((count / stats.terminalCommandsCount) * 100) : 0;
              return (
                <div key={cat.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${cat.color.replace('text-', 'bg-')}`} />
                    <span className="text-xs font-semibold text-text-secondary truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-bold text-text-primary">{count}</span>
                    <span className="text-[10px] text-text-muted font-semibold">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chronological Commands feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-6">Executed Shell Log</h3>
          
          {commandsLog.length === 0 ? (
            <div className="text-center py-12 text-xs text-text-secondary font-semibold">No terminal commands intercepted</div>
          ) : (
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-2">
              {commandsLog.slice(0, 50).map((cmd, idx) => {
                const date = new Date(cmd.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                const catObj = commandCategories.find(c => c.key === cmd.category) || commandCategories[6];
                
                return (
                  <div key={`${cmd.timestamp}-${idx}`} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card-hover-bg/30 border border-border-default hover:border-border-hover transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${catObj.bgColor} ${catObj.color}`}>
                        <Command size={14} />
                      </div>
                      <div className="min-w-0">
                        <code className="text-xs font-mono text-text-primary truncate block max-w-sm sm:max-w-md">{cmd.command}</code>
                        <div className="text-[9px] text-text-muted font-semibold mt-0.5 flex items-center gap-1.5">
                          <span className="uppercase text-[8px] text-accent-primary">{cmd.projectName}</span>
                          <span>·</span>
                          <span>Category: {catObj.name}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted font-bold shrink-0">{timeStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
