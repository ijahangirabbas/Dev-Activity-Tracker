'use client';

import React, { useState, useMemo } from 'react';
import { useSessions } from 'web/hooks/useSessions';
import { aggregateStats } from 'web/lib/dataHelpers';
import { Folder, GitBranch, Shield, Terminal, Zap, BookOpen } from 'lucide-react';

export default function ProjectsPage() {
  const { data: sessions, isLoading } = useSessions();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Group sessions by project name to build workspace stats
  const projectsData = useMemo(() => {
    if (!sessions) return [];
    
    // Group all sessions by workspaceName
    const grouped: Record<string, typeof sessions> = {};
    sessions.forEach(s => {
      const name = s.workspaceName || 'Unknown Project';
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(s);
    });

    return Object.entries(grouped).map(([name, projSessions]) => {
      const agg = aggregateStats(projSessions);
      
      // Collect unique branches
      const branches = Array.from(new Set(projSessions.map(s => s.branch).filter(Boolean)));
      
      return {
        name,
        repository: projSessions[0]?.repository || 'No Repository',
        totalDuration: agg.totalDuration,
        codingTime: agg.codingTime,
        readingTime: agg.readingTime,
        commitsCount: projSessions.reduce((acc, curr) => acc + (curr.gitCommitsCount || 0), 0),
        terminalTime: agg.terminalTime,
        branches,
        languages: Object.entries(agg.languages).sort((a, b) => b[1] - a[1]),
        filesCount: Object.keys(agg.files).length
      };
    }).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [sessions]);

  // Set default selection
  useMemo(() => {
    if (projectsData.length > 0 && !selectedProject) {
      setSelectedProject(projectsData[0].name);
    }
  }, [projectsData, selectedProject]);

  const activeProj = projectsData.find(p => p.name === selectedProject);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6 py-4 animate-pulse">
        <div className="h-8 w-48 bg-border-default rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-96 lg:col-span-1 bg-card-bg/60 border border-card-border rounded-2xl" />
          <div className="h-96 lg:col-span-3 bg-card-bg/60 border border-card-border rounded-2xl" />
        </div>
      </div>
    );
  }

  if (projectsData.length === 0) {
    return (
      <div className="text-center py-20 bg-card-bg border border-border-default rounded-2xl flex flex-col items-center justify-center">
        <Folder size={48} className="text-text-muted mb-4" />
        <h3 className="text-lg font-bold text-text-primary">No Projects Tracked</h3>
        <p className="text-xs text-text-secondary mt-1">Activate the VS Code extension to start logging workspace session data.</p>
      </div>
    );
  }

  const formatHrs = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary">Workspaces & Projects</h1>
        <p className="text-xs text-text-secondary mt-1">Detailed breakdowns of repository contributions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Project List */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-4 flex flex-col gap-2 max-h-[600px] overflow-y-auto">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2">Tracked folders</div>
          {projectsData.map(proj => (
            <button
              key={proj.name}
              onClick={() => setSelectedProject(proj.name)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition duration-200 border cursor-pointer ${
                selectedProject === proj.name
                  ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                  : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-card-hover-bg/50'
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{proj.name}</div>
                <div className="text-[10px] text-text-muted truncate">{proj.repository}</div>
              </div>
              <span className="text-xs font-bold text-text-muted">{formatHrs(proj.totalDuration)}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Project details */}
        {activeProj && (
          <div className="lg:col-span-3 space-y-6">
            <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-[50px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
              
              <div className="flex justify-between items-start border-b border-border-default pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{activeProj.name}</h2>
                  <div className="text-xs text-accent-primary mt-1 font-semibold flex items-center gap-1.5">
                    <Shield size={12} />
                    <span>Repo: {activeProj.repository}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted uppercase font-semibold tracking-wider">Total logged</div>
                  <div className="text-2xl md:text-3xl font-serif font-bold text-text-primary mt-1">{formatHrs(activeProj.totalDuration)}</div>
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-card-hover-bg/20 border border-border-default">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={10} className="text-accent-primary" />
                    <span>Coding Time</span>
                  </div>
                  <div className="text-lg md:text-xl font-serif font-semibold text-text-primary mt-1">{formatHrs(activeProj.codingTime)}</div>
                </div>

                <div className="p-4 rounded-xl bg-card-hover-bg/20 border border-border-default">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={10} className="text-accent-blue" />
                    <span>Reading Time</span>
                  </div>
                  <div className="text-lg md:text-xl font-serif font-semibold text-text-primary mt-1">{formatHrs(activeProj.readingTime)}</div>
                </div>

                <div className="p-4 rounded-xl bg-card-hover-bg/20 border border-border-default">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch size={10} className="text-accent-orange" />
                    <span>Commits Sync</span>
                  </div>
                  <div className="text-lg md:text-xl font-serif font-semibold text-text-primary mt-1">{activeProj.commitsCount} Commits</div>
                </div>

                <div className="p-4 rounded-xl bg-card-hover-bg/20 border border-border-default">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={10} className="text-accent-green" />
                    <span>Terminal Time</span>
                  </div>
                  <div className="text-lg md:text-xl font-serif font-semibold text-text-primary mt-1">{formatHrs(activeProj.terminalTime)}</div>
                </div>
              </div>

              {/* Languages & active branches split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Programming languages</h3>
                  {activeProj.languages.length === 0 ? (
                    <div className="text-xs text-text-muted font-semibold py-2">No language metrics recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {activeProj.languages.map(([lang, time]) => {
                        const pct = activeProj.totalDuration > 0 ? Math.round((time / activeProj.totalDuration) * 100) : 0;
                        return (
                          <div key={lang} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-text-secondary">{lang}</span>
                              <span className="text-text-primary">{formatHrs(time)} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-border-default rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-accent-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Tracked Git Branches</h3>
                  {activeProj.branches.length === 0 ? (
                    <div className="text-xs text-text-muted font-semibold py-2">No git branch switches detected</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activeProj.branches.map(br => (
                        <div key={br} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-hover-bg/30 border border-border-default text-xs text-text-secondary font-semibold">
                          <GitBranch size={12} className="text-text-muted" />
                          <span>{br}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
