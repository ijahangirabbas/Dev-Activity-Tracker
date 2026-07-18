'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';

const COMPARISON_FEATURES = [
  {
    feature: 'Tracking Activation',
    tracker: '100% Fully Automatic (Background Daemon)',
    manual: 'Manual (Remembering to click Start/Stop)',
    trackerStatus: true,
    manualStatus: false,
  },
  {
    feature: 'Activity Metric Resolution',
    tracker: 'Seconds resolution via keystroke/scroll heuristics',
    manual: 'Coarse estimates or rounded hourly slots',
    trackerStatus: true,
    manualStatus: false,
  },
  {
    feature: 'Source Privacy Model',
    tracker: 'Local obfuscation hashing (Paths stay local)',
    manual: 'Metadata/names uploaded straight to cloud',
    trackerStatus: true,
    manualStatus: false,
  },
  {
    feature: 'Terminal / CLI Monitoring',
    tracker: 'Autologs npm, cargo, and git shell commands',
    manual: 'None (No command awareness)',
    trackerStatus: true,
    manualStatus: false,
  },
  {
    feature: 'Git Integration Sync',
    tracker: 'Matches commit events directly to work slots',
    manual: 'None (Requires manual notes matching)',
    trackerStatus: true,
    manualStatus: false,
  },
  {
    feature: 'AI Assistance Multiplier',
    tracker: 'Estimates LLM prompt productivity ratios',
    manual: 'None',
    trackerStatus: true,
    manualStatus: false,
  },
  {
    feature: 'Offline Operation Support',
    tracker: 'Works fully offline (stores in db.json)',
    manual: 'Fails to load or locks out without server sync',
    trackerStatus: true,
    manualStatus: false,
  }
];

export default function ComparisonTable() {
  return (
    <section id="pricing" className="py-28 px-4 max-w-5xl mx-auto border-t border-border-default relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] radial-glow pointer-events-none -z-10" />

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary font-sans">
          Built to Replace the Manual Timer
        </h2>
        <p className="mt-4 text-text-secondary text-sm md:text-base leading-relaxed">
          Stop wasting cognitive energy clicking start and stop. Let your editor record your metrics with clinical precision.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="border border-border-default rounded-2xl overflow-hidden bg-card-bg shadow-lg dark:shadow-2xl">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border-default bg-card-hover-bg/30">
              <th className="p-4 md:p-5 font-bold text-text-secondary">Capability</th>
              <th className="p-4 md:p-5 font-bold text-accent-primary bg-accent-primary/5">DevTracker</th>
              <th className="p-4 md:p-5 font-bold text-text-muted">Legacy Manual Timers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {COMPARISON_FEATURES.map((item) => (
              <tr key={item.feature} className="hover:bg-card-hover-bg/30 transition-colors">
                <td className="p-4 md:p-5 font-semibold text-text-primary">
                  {item.feature}
                </td>
                <td className="p-4 md:p-5 bg-accent-primary/[0.015] border-x border-border-default text-text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-accent-primary" />
                    </div>
                    <span>{item.tracker}</span>
                  </div>
                </td>
                <td className="p-4 md:p-5 text-text-secondary">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-card-hover-bg border border-border-default flex items-center justify-center shrink-0">
                      <X size={11} className="text-text-muted" />
                    </div>
                    <span>{item.manual}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Horizontal Contributor Section */}
      <div className="mt-16 max-w-4xl mx-auto p-6 md:p-8 rounded-3xl border border-accent-primary/20 bg-accent-primary/[0.02] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-md dark:shadow-2xl">
        {/* Glow spotlight behind */}
        <div className="absolute top-[-50%] left-[20%] w-[300px] h-[200px] bg-accent-primary/10 blur-[80px] rounded-full pointer-events-none -z-10" />
        
        {/* Left text column */}
        <div className="flex-1 text-left space-y-3">
          <span className="inline-flex text-[9px] font-bold uppercase tracking-[0.2em] text-accent-primary bg-accent-primary/10 px-3.5 py-1 rounded-full border border-accent-primary/20">
            Support Open Source
          </span>
          <h3 className="text-xl font-bold text-text-primary">Contribute to the Developer</h3>
          <p className="text-text-body text-xs leading-relaxed max-w-md">
            Dev-Activity-Tracker is completely open source and free. Support ongoing maintenance, servers, and compiler extensions.
          </p>
        </div>

        {/* Right CTA column */}
        <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-border-default pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-between md:justify-start">
          <div className="text-left md:text-right">
            <span className="text-[10px] text-text-muted block uppercase tracking-wider">One-time Tier</span>
            <div className="text-2xl font-extrabold text-text-primary font-mono tracking-tight mt-0.5">
              $5.00
            </div>
          </div>
          <Link
            to="/payment"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary text-white font-bold text-xs shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Contribute $5</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

    </section>
  );
}
