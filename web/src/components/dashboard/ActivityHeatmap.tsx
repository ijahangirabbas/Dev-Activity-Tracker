'use client';

import React, { useState } from 'react';
import { DailyProgress } from 'web/types';
import { formatDuration, localDateStr } from 'web/lib/dataHelpers';

interface ActivityHeatmapProps {
  dailyProgress: Record<string, DailyProgress>;
}

export default function ActivityHeatmap({ dailyProgress }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; duration: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate 53 weeks (371 days) of columns, ending today, aligned to starts of weeks (Sunday)
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const daysToShow = 371;
  const startDate = new Date(now.getTime() - daysToShow * oneDay);
  const dayOfWeek = startDate.getDay();
  const adjustedStartDate = new Date(startDate.getTime() - dayOfWeek * oneDay);

  interface HeatmapCell {
    date: string;
    dateObj: Date;
    duration: number;
    level: number;
  }
  const cells: HeatmapCell[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const currentDate = new Date(adjustedStartDate.getTime() + i * oneDay);
    const dateStr = localDateStr(currentDate);
    const dayData = dailyProgress[dateStr];
    const duration = dayData ? dayData.developmentTime : 0;

    let level = 0;
    if (duration > 0) {
      if (duration < 1800) level = 1;       // < 30 mins
      else if (duration < 7200) level = 2;  // < 2 hours
      else if (duration < 14400) level = 3; // < 4 hours
      else level = 4;                       // >= 4 hours
    }
    cells.push({ date: dateStr, dateObj: currentDate, duration, level });
  }

  const handleMouseEnter = (e: React.MouseEvent, day: HeatmapCell) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay({ date: day.date, duration: day.duration });
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 45,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Collect positions where months change to show labels
  const monthLabels: { label: string; index: number }[] = [];
  let lastMonth = -1;
  cells.forEach((cell, idx) => {
    const currentMonth = cell.dateObj.getMonth();
    // Only add labels at the start of a week to avoid overlap
    if (currentMonth !== lastMonth && cell.dateObj.getDay() === 0) {
      monthLabels.push({ label: MONTHS[currentMonth], index: Math.floor(idx / 7) });
      lastMonth = currentMonth;
    }
  });

  return (
    <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Coding Heatmap</h3>
          <p className="text-xs text-text-secondary mt-1">GitHub-style yearly breakdown of active dev sessions</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-text-muted font-semibold uppercase tracking-wider">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm level-0 border border-border-default" />
          <div className="w-2.5 h-2.5 rounded-sm level-1" />
          <div className="w-2.5 h-2.5 rounded-sm level-2" />
          <div className="w-2.5 h-2.5 rounded-sm level-3" />
          <div className="w-2.5 h-2.5 rounded-sm level-4" />
          <span>More</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[700px] flex flex-col">
          {/* Month Labels */}
          <div className="h-6 relative text-[10px] font-bold text-text-muted uppercase select-none mb-1">
            {monthLabels.map((lbl, idx) => (
              <span
                key={`${lbl.label}-${idx}`}
                className="absolute"
                style={{ left: `${lbl.index * 13}px` }}
              >
                {lbl.label}
              </span>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex gap-[3px]">
            {/* Day Labels */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-text-muted w-6 pr-2 select-none h-[93px]">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="grid grid-flow-col grid-rows-7 gap-[3px] h-[93px]">
              {cells.map((day, idx) => (
                <div
                  key={`${day.date}-${idx}`}
                  onMouseEnter={(e) => handleMouseEnter(e, day)}
                  onMouseLeave={handleMouseLeave}
                  className={`w-2.5 h-2.5 rounded-[2px] transition-colors duration-200 cursor-pointer ${
                    day.level === 0 ? 'level-0' :
                    day.level === 1 ? 'level-1' :
                    day.level === 2 ? 'level-2' :
                    day.level === 3 ? 'level-3' : 'level-4'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 bg-card-bg border border-card-border text-[11px] text-text-secondary rounded-xl shadow-2xl pointer-events-none -translate-x-1/2 flex flex-col gap-0.5"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <strong className="text-text-primary font-bold">
            {new Date(hoveredDay.date).toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </strong>
          <span>{formatDuration(hoveredDay.duration)} logged</span>
        </div>
      )}
    </div>
  );
}
