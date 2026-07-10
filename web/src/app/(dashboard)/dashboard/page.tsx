'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSessions } from 'web/hooks/useSessions';
import { useProgress } from 'web/hooks/useProgress';
import { useStreaks } from 'web/hooks/useStreaks';
import { filterSessionsByRange, aggregateStats, TimeRange } from 'web/lib/dataHelpers';
import OverviewMetrics from 'web/components/dashboard/OverviewMetrics';
import GoalRing from 'web/components/dashboard/GoalRing';
import ActivityHeatmap from 'web/components/dashboard/ActivityHeatmap';
import ActivityBreakdown from 'web/components/dashboard/ActivityBreakdown';
import LanguageMetrics from 'web/components/dashboard/LanguageMetrics';
import TimelineEvents from 'web/components/dashboard/TimelineEvents';
import { Loader2, Calendar } from 'lucide-react';

export default function OverviewPage() {
  const [range, setRange] = useState<TimeRange>('thisMonth');

  // Fetch metrics from Supabase DB via React Query hooks
  const { data: sessions, isLoading: sessionsLoading, error: sessionsErr } = useSessions();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: streaksData, isLoading: streaksLoading } = useStreaks();

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

  if (sessionsErr || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card-bg border border-border-default rounded-2xl mt-12">
        <h3 className="text-xl font-bold text-text-primary">Failed to Retrieve Analytics</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-2 leading-relaxed">
          Verify your network and confirm that your Supabase Auth user ID and API values are correct.
        </p>
      </div>
    );
  }

  // Calculate streaks
  const devStreakStats = streaks ? {
    currentStreak: streaks.development_current,
    longestStreak: streaks.development_longest,
    lastActiveDate: streaks.development_last_active,
  } : undefined;

  const codingStreakStats = streaks ? {
    currentStreak: streaks.coding_current,
    longestStreak: streaks.coding_longest,
    lastActiveDate: streaks.coding_last_active,
  } : undefined;

  return (
    <div className="space-y-8 py-2">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary">Productivity Overview</h1>
          <p className="text-xs text-text-secondary mt-1">Real-time developer activity reports</p>
        </div>

        {/* Range Selector */}
        <div className="relative shrink-0 w-full sm:w-auto">
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
