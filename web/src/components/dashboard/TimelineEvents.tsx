'use client';

import React from 'react';
import { TimelineEvent } from 'web/types';

interface TimelineEventsProps {
  events: (TimelineEvent & { projectName: string })[];
}

export default function TimelineEvents({ events }: TimelineEventsProps) {
  // Limit to latest 30 events for performance
  const latestEvents = events.slice(0, 30);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coding': return 'bg-accent-primary';
      case 'reading': return 'bg-accent-blue';
      case 'debugging': return 'bg-accent-red';
      case 'terminal': return 'bg-accent-green';
      case 'git': return 'bg-accent-orange';
      case 'testing': return 'bg-accent-cyan';
      case 'ai': return 'bg-accent-purple';
      case 'idle': return 'bg-text-muted';
      default: return 'bg-text-muted';
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-bold text-text-primary">Activity History</h3>
        <p className="text-xs text-text-secondary mt-1 mb-6">Recent IDE workspace updates</p>

        {latestEvents.length === 0 ? (
          <div className="text-center py-12 text-sm text-text-muted font-semibold">No recent events logged</div>
        ) : (
          <div className="relative border-l border-border-default ml-3 pl-6 space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {latestEvents.map((evt, idx) => {
              const date = new Date(evt.timestamp);
              const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              
              return (
                <div key={`${evt.timestamp}-${idx}`} className="relative group">
                  {/* Dot */}
                  <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-canvas ${getCategoryColor(evt.category)}`} />
                  
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-text-muted flex items-center gap-1.5">
                      <span>{dateStr} · {timeStr}</span>
                      <span className="text-accent-primary/90 truncate max-w-[150px]">({evt.projectName})</span>
                    </div>
                    <div className="text-xs font-semibold text-text-secondary leading-relaxed group-hover:text-text-primary transition">
                      {evt.description}
                    </div>
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
