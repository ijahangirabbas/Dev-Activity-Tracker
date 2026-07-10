'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Database, Eye, Cloud, LineChart } from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    icon: Code,
    title: 'IDE Activity',
    description: 'Listen to keypresses, cursor events, and terminal calls in real-time inside VS Code or Cursor.',
    color: 'text-accent-primary',
    bgColor: 'bg-accent-primary/10'
  },
  {
    step: '02',
    icon: Eye,
    title: 'Local Obfuscation',
    description: 'Hash sensitive file paths and project names. Raw directories never exit your memory threads.',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10'
  },
  {
    step: '03',
    icon: Database,
    title: 'Local Database',
    description: 'Cache metrics securely inside a local JSON database file on your file system.',
    color: 'text-accent-cyan',
    bgColor: 'bg-accent-cyan/10'
  },
  {
    step: '04',
    icon: Cloud,
    title: 'Secure Cloud Sync',
    description: 'Optionally sync data to your personal cloud DB through JWT-validated credentials.',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10'
  },
  {
    step: '05',
    icon: LineChart,
    title: 'Rich Analytics',
    description: 'Query comprehensive focus grids, language breakdowns, and timelines in your web app.',
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10'
  }
];

export default function DeveloperWorkflow() {
  return (
    <section id="workflow" className="py-28 px-4 max-w-7xl mx-auto border-t border-border-default relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] radial-glow-cyan pointer-events-none -z-10" />
      
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary font-sans">
          How Developer Analytics Works
        </h2>
        <p className="mt-4 text-text-secondary text-sm md:text-base leading-relaxed">
          Designed specifically to run quietly inside your environment, maximizing local control and speed.
        </p>
      </div>

      <div className="relative">
        {/* Horizontal Connector Line */}
        <div className="hidden lg:block absolute top-14 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-accent-primary/20 via-accent-purple/20 to-accent-green/20 -z-10" />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group relative"
              >
                {/* Visual Step Number */}
                <span className="absolute top-[-24px] text-5xl font-extrabold font-mono text-text-primary/[0.08] group-hover:text-accent-primary/25 transition-colors duration-500 select-none -z-10">
                  {step.step}
                </span>

                {/* Glowing Icon Container */}
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-card-border bg-card-bg transition-all duration-500 group-hover:scale-110 group-hover:border-card-hover-border group-hover:bg-card-hover-bg relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${step.bgColor}`} />
                  <Icon size={28} className={`relative z-10 ${step.color} group-hover:scale-110 transition-transform duration-300`} />
                </div>

                <h3 className="text-base font-bold text-text-primary group-hover:text-text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="mt-3 text-text-secondary text-xs leading-relaxed max-w-xs px-2">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
