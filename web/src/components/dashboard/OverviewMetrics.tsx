'use client';

import React from 'react';
import { AggregatedStats, formatDuration } from 'web/lib/dataHelpers';
import { Monitor, Zap, Flame, FolderOpen } from 'lucide-react';
import { StreakStats } from 'web/types';

interface OverviewMetricsProps {
  stats: AggregatedStats;
  streaks: StreakStats | undefined;
  codingStreak: StreakStats | undefined;
}

export default function OverviewMetrics({ stats, streaks, codingStreak }: OverviewMetricsProps) {
  const currentDevStreak = streaks?.currentStreak ?? 0;
  const currentCodingStreak = codingStreak?.currentStreak ?? 0;
  const projectsCount = Object.keys(stats.projects).length;

  const cards = [
    {
      title: 'Development Time',
      value: formatDuration(stats.totalDuration),
      subtext: 'Total time active in VS Code',
      icon: Monitor,
      color: 'text-accent-primary',
      bgColor: 'bg-accent-primary/10 border-accent-primary/25',
    },
    {
      title: 'Coding Time',
      value: formatDuration(stats.codingTime),
      subtext: 'Active typing & text editing',
      icon: Zap,
      color: 'text-accent-amber',
      bgColor: 'bg-accent-amber/10 border-accent-amber/25',
    },
    {
      title: 'Current Streak',
      value: `${currentDevStreak} Days`,
      subtext: `Coding streak: ${currentCodingStreak} days`,
      icon: Flame,
      color: 'text-accent-red',
      bgColor: 'bg-accent-red/10 border-accent-red/25',
    },
    {
      title: 'Active Projects',
      value: projectsCount.toString(),
      subtext: 'Workspaces tracked in period',
      icon: FolderOpen,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10 border-accent-green/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="p-6 rounded-2xl glass-card relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 group-hover:opacity-20 transition duration-300 pointer-events-none -z-10 ${card.color.replace('text-', 'bg-')}`} />
            
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{card.title}</h4>
                <div className="text-3xl md:text-4xl font-serif font-bold text-text-primary mt-2">{card.value}</div>
                <div className="text-xs text-text-secondary mt-2 font-medium">{card.subtext}</div>
              </div>
              <div className={`p-3 rounded-xl border ${card.bgColor}`}>
                <Icon size={20} className={card.color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
