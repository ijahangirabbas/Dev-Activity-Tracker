'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, HardDrive, ShieldCheck } from 'lucide-react';

const STATS = [
  {
    icon: ShieldCheck,
    stat: '100%',
    label: 'Privacy Guarantee',
    sub: 'Hashed local indexing prevents code ingestion.'
  },
  {
    icon: HardDrive,
    stat: '<1.5%',
    label: 'Average CPU Overhead',
    sub: 'Runs asynchronously in separate system threads.'
  },
  {
    icon: Sparkles,
    stat: 'MIT',
    label: 'Open Source License',
    sub: 'Inspect, build, and run your custom daemon copies.'
  },
  {
    icon: Shield,
    stat: 'Offline',
    label: 'First-Class Vault Database',
    sub: 'Operates in air-gapped secure development servers.'
  }
];

export default function SocialProof() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative border-t border-border-default">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
              className="p-6 rounded-2xl border border-card-border bg-card-bg text-center flex flex-col items-center justify-between group hover:border-card-hover-border hover:bg-card-hover-bg transition-all duration-300 shadow-sm dark:shadow-none"
            >
              <div className="w-10 h-10 rounded-xl bg-card-hover-bg/50 border border-border-default flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-350">
                <Icon size={18} className="text-accent-primary" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-text-primary tracking-tight font-sans">
                  {stat.stat}
                </div>
                <div className="text-xs font-bold text-text-secondary mt-1 uppercase tracking-wide">
                  {stat.label}
                </div>
                <div className="text-[11px] text-text-muted mt-2 leading-relaxed">
                  {stat.sub}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
