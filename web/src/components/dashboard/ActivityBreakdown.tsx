'use client';

import React from 'react';
import { AggregatedStats, formatDuration } from 'web/lib/dataHelpers';

interface ActivityBreakdownProps {
  stats: AggregatedStats;
}

export default function ActivityBreakdown({ stats }: ActivityBreakdownProps) {
  const categories = [
    { name: 'Coding', time: stats.codingTime, color: 'bg-accent-primary', textColor: 'text-accent-primary' },
    { name: 'Reading', time: stats.readingTime, color: 'bg-accent-blue', textColor: 'text-accent-blue' },
    { name: 'Debugging', time: stats.debuggingTime, color: 'bg-accent-red', textColor: 'text-accent-red' },
    { name: 'Terminal', time: stats.terminalTime, color: 'bg-accent-green', textColor: 'text-accent-green' },
    { name: 'Git Operations', time: stats.gitTime, color: 'bg-accent-orange', textColor: 'text-accent-orange' },
    { name: 'Testing', time: stats.testingTime, color: 'bg-accent-cyan', textColor: 'text-accent-cyan' },
    { name: 'AI Assistance', time: stats.aiTime, color: 'bg-accent-purple', textColor: 'text-accent-purple' }
  ];

  // Sort by time descending
  const activeCategories = categories
    .filter(cat => cat.time > 0)
    .sort((a, b) => b.time - a.time);

  return (
    <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-bold text-text-primary">Activity Breakdown</h3>
        <p className="text-xs text-text-secondary mt-1 mb-6">Heuristic categorization splits</p>

        {activeCategories.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted font-semibold">No activity tracked in this range</div>
        ) : (
          <div className="space-y-4">
            {activeCategories.map(cat => {
              const pct = stats.totalDuration > 0 ? Math.round((cat.time / stats.totalDuration) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-secondary">{cat.name}</span>
                    <span className="text-text-primary flex items-center gap-1.5">
                      <span>{formatDuration(cat.time)}</span>
                      <span className="text-[10px] text-text-muted font-medium">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border-default rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
