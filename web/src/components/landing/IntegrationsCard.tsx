'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Sparkles, LayoutDashboard } from 'lucide-react';

const REASONS = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Privacy mode hashes file paths and folders. Your actual source code and files are never read or uploaded.',
    color: 'text-indigo-400'
  },
  {
    icon: Zap,
    title: 'Zero Overhead Performance',
    description: 'Runs as a lightweight daemon inside VS Code. Tick evaluation happens asynchronously in a separate process thread.',
    color: 'text-amber-400'
  },
  {
    icon: Sparkles,
    title: 'Developer Experience',
    description: 'Interactive status bar and single-click access to local dashboard webview. Integrates directly into your daily coding cycle.',
    color: 'text-cyan-400'
  },
  {
    icon: LayoutDashboard,
    title: 'Scalable Synced Backups',
    description: 'Automatic rolling backups protect your metrics, with instant upload capabilities to your personal Supabase Cloud.',
    color: 'text-emerald-400'
  }
];

export default function IntegrationsCard() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto border-t border-slate-900/60 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] radial-glow pointer-events-none -z-10" />
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl md:text-6xl font-serif text-slate-100">
          Why Developers Choose Us
        </h2>
        <p className="mt-4 text-slate-400 text-lg">
          Designed specifically for software engineers who want analytical insights without sacrificing speed or security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {REASONS.map((reason, idx) => {
          const Icon = reason.icon;
          return (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 rounded-2xl glass-card flex gap-6 items-start hover:border-slate-800 transition-all duration-300"
            >
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-850 shrink-0">
                <Icon size={24} className={reason.color} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">{reason.title}</h3>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">{reason.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
