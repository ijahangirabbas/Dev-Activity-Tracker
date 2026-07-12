'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSessions } from 'web/hooks/useSessions';
import { useProgress } from 'web/hooks/useProgress';
import { useStreaks } from 'web/hooks/useStreaks';
import { filterSessionsByRange, aggregateStats, TimeRange } from 'web/lib/dataHelpers';
import { getMockSessions, getMockProgress, getMockStreaks } from 'web/lib/demoData';
import OverviewMetrics from 'web/components/dashboard/OverviewMetrics';
import GoalRing from 'web/components/dashboard/GoalRing';
import ActivityHeatmap from 'web/components/dashboard/ActivityHeatmap';
import ActivityBreakdown from 'web/components/dashboard/ActivityBreakdown';
import LanguageMetrics from 'web/components/dashboard/LanguageMetrics';
import TimelineEvents from 'web/components/dashboard/TimelineEvents';
import { Loader2, Calendar, Sparkles } from 'lucide-react';

export default function OverviewPage() {
  const [range, setRange] = useState<TimeRange>('thisMonth');
  const [useDemo, setUseDemo] = useState(() => {
    return localStorage.getItem('dev_tracker_use_demo') === 'true';
  });

  // Fetch metrics from Supabase DB via React Query hooks
  const { data: realSessions, isLoading: sessionsLoading, error: sessionsErr } = useSessions();
  const { data: realProgress, isLoading: progressLoading } = useProgress();
  const { data: realStreaks, isLoading: streaksLoading } = useStreaks();

  // If there's no data at all (empty database), default to demo mode automatically
  const isDatabaseEmpty = !sessionsLoading && (!realSessions || realSessions.length === 0);
  const activeDemo = useDemo || isDatabaseEmpty;

  const sessions = useMemo(() => {
    if (activeDemo) return getMockSessions();
    return realSessions;
  }, [realSessions, activeDemo]);

  const progress = useMemo(() => {
    if (activeDemo) return getMockProgress();
    return realProgress;
  }, [realProgress, activeDemo]);

  const streaksData = useMemo(() => {
    if (activeDemo) return getMockStreaks();
    return realStreaks;
  }, [realStreaks, activeDemo]);

  // Aggregate stats on the fly based on active range
  const stats = useMemo(() => {
    if (!sessions) return null;
    const filtered = filterSessionsByRange(sessions, range);
    return aggregateStats(filtered);
  }, [sessions, range]);

  // Map progress into a key-value record for fast date lookup in heatmap
  const progressMap = useMemo(() => {
    if (!progress) return {};
    return progress.reduce((acc, curr) => {
      acc[curr.date] = curr;
      return acc;
    }, {} as Record<string, typeof progress[0]>);
  }, [progress]);

  // Extract streaks from response list
  const streaks = streaksData?.[0];

  const getLiveStreakCount = (current: number, lastActive: string) => {
    if (!lastActive) return 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (lastActive === todayStr) return current;

    const lastDate = new Date(lastActive).getTime();
    const todayDate = new Date(todayStr).getTime();
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 1 ? current : 0;
  };

  // Resolve isLoading state
  const isPageLoading = sessionsLoading || progressLoading || streaksLoading;

  if (isPageLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6 py-4 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-8 w-48 bg-border-default rounded-lg" />
        
        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card-bg/60 border border-card-border rounded-2xl" />
          ))}
        </div>

        {/* Heatmap & Goal Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 lg:col-span-2 bg-card-bg/60 border border-card-border rounded-2xl" />
          <div className="h-64 bg-card-bg/60 border border-card-border rounded-2xl" />
        </div>

        {/* Breakdown Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-card-bg/60 border border-card-border rounded-2xl" />
          <div className="h-80 bg-card-bg/60 border border-card-border rounded-2xl" />
          <div className="h-80 bg-card-bg/60 border border-card-border rounded-2xl" />
        </div>
      </div>
    );
  }

  if (sessionsErr && !activeDemo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card-bg border border-border-default rounded-2xl mt-12">
        <h3 className="text-xl font-bold text-text-primary">Failed to Retrieve Analytics</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-2 leading-relaxed">
          Verify your network and confirm that your user configurations are correct.
        </p>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate streaks
  const devStreakStats = streaks ? {
    currentStreak: getLiveStreakCount(streaks.development_current, streaks.development_last_active),
    longestStreak: streaks.development_longest,
    lastActiveDate: streaks.development_last_active,
  } : undefined;

  const codingStreakStats = streaks ? {
    currentStreak: getLiveStreakCount(streaks.coding_current, streaks.coding_last_active),
    longestStreak: streaks.coding_longest,
    lastActiveDate: streaks.coding_last_active,
  } : undefined;

  const handleDemoToggle = (checked: boolean) => {
    setUseDemo(checked);
    localStorage.setItem('dev_tracker_use_demo', checked ? 'true' : 'false');
  };

  return (
    <div className="space-y-6 py-2">
      {/* Demo Banner */}
      {activeDemo && (
        <div className="p-4 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs flex justify-between items-center gap-4 leading-relaxed animate-fade-in relative z-10">
          <div className="flex gap-2.5 items-center">
            <Sparkles size={16} className="shrink-0 animate-pulse" />
            <span>
              {isDatabaseEmpty 
                ? "Showing sandbox Demo Data because you don't have any local tracking records yet." 
                : "Showing sandbox Demo Data."}{' '}
              Copy your connection key from the **Settings** page and paste it into VS Code to track real code logs!
            </span>
          </div>
          {!isDatabaseEmpty && (
            <button 
              onClick={() => handleDemoToggle(false)}
              className="px-3 py-1.5 rounded-xl border border-accent-primary/20 bg-accent-primary/15 hover:bg-accent-primary/30 text-[10px] font-bold cursor-pointer active:scale-95 transition whitespace-nowrap"
            >
              Real Data
            </button>
          )}
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary">Productivity Overview</h1>
          <p className="text-xs text-text-secondary mt-1">Real-time developer activity reports</p>
        </div>

        {/* Controls block */}
        <div className="flex flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          {/* Demo Toggle switch */}
          <div className="flex items-center gap-2 bg-card-bg/60 border border-border-default rounded-xl px-4 py-2 text-xs font-semibold text-text-secondary select-none">
            <span>Demo Data</span>
            <label className="relative inline-flex items-center cursor-pointer ml-1">
              <input 
                type="checkbox" 
                checked={activeDemo} 
                onChange={(e) => handleDemoToggle(e.target.checked)} 
                className="sr-only peer" 
                disabled={isDatabaseEmpty}
              />
              <div className="w-8 h-4.5 bg-border-default rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent-primary peer-disabled:opacity-50" />
            </label>
          </div>

          {/* Range Selector */}
          <div className="relative shrink-0 flex-1 sm:flex-initial">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted pointer-events-none">
              <Calendar size={14} />
            </span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as TimeRange)}
              className="w-full sm:w-auto bg-card-bg border border-border-default rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-text-secondary focus:outline-none focus:border-accent-primary/45 cursor-pointer appearance-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <OverviewMetrics
        stats={stats}
        streaks={devStreakStats}
        codingStreak={codingStreakStats}
      />

      {/* Grid with Heatmap and Goal completeness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityHeatmap dailyProgress={progressMap} />
        </div>
        <div>
          <GoalRing todaySeconds={stats.todayDuration} goalSeconds={streaks?.goal_seconds ?? 14400} />
        </div>
      </div>

      {/* Ratios and timelines row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActivityBreakdown stats={stats} />
        <LanguageMetrics stats={stats} />
        <TimelineEvents events={stats.timelineEvents} />
      </div>
    </div>
  );
}
