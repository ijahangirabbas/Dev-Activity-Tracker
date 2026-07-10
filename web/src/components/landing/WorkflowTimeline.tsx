'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, ShieldAlert, Database, CloudLightning, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    icon: Monitor,
    title: 'IDE Activity',
    description: 'Work in your IDE. Keypresses, cursor moves, and active terminals are detected automatically.',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10'
  },
  {
    icon: ShieldAlert,
    title: 'Local Hashing',
    description: 'Privacy mode hashes file paths and project names. Secrets never exit your machine.',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10'
  },
  {
    icon: Database,
    title: 'Offline Storage',
    description: 'All tracking metrics are saved locally in a structured JSON database on your computer.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10'
  },
  {
    icon: CloudLightning,
    title: 'Supabase Sync',
    description: 'When online, logs sync securely to your personal cloud database instance using JWT auth.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
  {
    icon: BarChart3,
    title: 'Premium Analytics',
    description: 'Open the web app or VS Code webview to inspect streaks, timelines, and goal progress.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  }
];

export default function WorkflowTimeline() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto border-t border-slate-900/60 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] radial-glow pointer-events-none -z-10" />
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-6xl font-serif text-slate-100">
          How Developer Analytics Works
        </h2>
        <p className="mt-4 text-slate-400 text-lg">
          A seamless flow designed to operate in the background, prioritizing developer privacy and local ownership.
        </p>
      </div>

      <div className="relative">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden lg:block absolute top-12 left-1/10 right-1/10 h-0.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 -z-10" />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group relative pt-6"
              >
                <span className="absolute top-0 text-7xl font-serif font-light text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors duration-500 select-none -z-10">0{idx + 1}</span>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 glass-card border border-slate-800 transition-all duration-500 group-hover:scale-110 group-hover:border-slate-700 relative`}>
                  <div className={`absolute inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${step.bgColor}`} />
                  <Icon size={32} className={`relative z-10 ${step.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-200">{step.title}</h3>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
