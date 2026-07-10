'use client';

import React from 'react';
import { AggregatedStats, formatDuration } from 'web/lib/dataHelpers';

interface LanguageMetricsProps {
  stats: AggregatedStats;
}

export default function LanguageMetrics({ stats }: LanguageMetricsProps) {
  const languages = Object.entries(stats.languages || {})
    .sort((a, b) => b[1] - a[1]);

  const totalTime = languages.reduce((acc, curr) => acc + curr[1], 0);

  return (
    <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-bold text-text-primary">Programming Languages</h3>
        <p className="text-xs text-text-secondary mt-1 mb-6">Time distribution per language tag</p>

        {languages.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted font-semibold">No language telemetry captured</div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {languages.map(([lang, time]) => {
              const pct = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
              return (
                <div key={lang} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-secondary">{lang}</span>
                    <span className="text-text-primary flex items-center gap-1.5">
                      <span>{formatDuration(time)}</span>
                      <span className="text-[10px] text-text-muted font-medium">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border-default rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-primary/80 transition-all duration-500"
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
