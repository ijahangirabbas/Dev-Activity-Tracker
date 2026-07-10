'use client';

import React from 'react';
import { formatHoursDecimal } from 'web/lib/dataHelpers';

interface GoalRingProps {
  todaySeconds: number;
  goalSeconds: number;
}

export default function GoalRing({ todaySeconds, goalSeconds }: GoalRingProps) {
  const target = goalSeconds > 0 ? goalSeconds : 14400; // default 4 hours
  const percentage = Math.min(Math.round((todaySeconds / target) * 100), 100);
  
  const radius = 50;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl glass-card">
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="var(--border-default)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="var(--accent-primary)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-text-primary">{percentage}%</span>
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Completed</span>
        </div>
      </div>

      <div className="text-center sm:text-left">
        <h3 className="text-lg font-bold text-text-primary">Daily Performance Goal</h3>
        <p className="text-xs text-text-secondary mt-1 max-w-xs">
          Your daily target is configured in VS Code settings. Keep your coding streak alive.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold">
          <span>{formatHoursDecimal(todaySeconds)}h / {formatHoursDecimal(target)}h Logged Today</span>
        </div>
      </div>
    </div>
  );
}
