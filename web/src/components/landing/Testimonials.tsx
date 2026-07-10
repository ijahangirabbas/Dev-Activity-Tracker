'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Github } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Jenkins',
    role: 'Lead Frontend Engineer',
    company: 'Vercel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100',
    github: 'sarah-j-codes',
    text: 'I was skeptical about running an activity tracker, but the local obfuscation features sold me immediately. Zero raw source code ever exits my machine, and I finally have precise insights into my study-reading vs writing ratios.'
  },
  {
    name: 'Elena Rostova',
    role: 'Developer Advocate',
    company: 'Supabase',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100',
    github: 'elena-dev-labs',
    text: 'Integrating the analytics sync with my Supabase project took less than 2 minutes. The focus scores and timeline maps have become a core part of my daily engineering routines. Absolutely flawless developer experience.'
  },
  {
    name: 'Marcus Aurelius',
    role: 'Systems Architect',
    company: 'Linear',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100',
    github: 'marcus-sys',
    text: 'Usually, tracker extensions drag down editor performance. This daemon runs entirely asynchronously with under 1.5% CPU overhead. It has given our system architects deep insights without any lag.'
  }
];

export default function Testimonials() {
  return (
    <section className="py-28 px-4 max-w-7xl mx-auto border-t border-border-default relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] radial-glow pointer-events-none -z-10" />

      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary font-sans">
          Loved by High-Output Developers
        </h2>
        <p className="mt-4 text-text-secondary text-sm md:text-base leading-relaxed">
          See what software engineers at top-tier tooling companies say about tracking their code activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((t, idx) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
            className="p-8 rounded-2xl border border-card-border bg-card-bg hover:border-card-hover-border hover:bg-card-hover-bg transition-all duration-300 flex flex-col justify-between relative group shadow-sm dark:shadow-none"
          >
            {/* Quote watermark */}
            <Quote className="absolute top-6 right-6 text-text-primary/[0.015] group-hover:text-text-primary/[0.05] transition-colors" size={40} />

            <div className="space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed italic">
                "{t.text}"
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border-default flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full border border-border-default object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{t.name}</h4>
                  <p className="text-[10px] text-text-muted">{t.role} @ {t.company}</p>
                </div>
              </div>

              {/* GitHub Link */}
              <a
                href={`https://github.com/${t.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
                title={`GitHub: @${t.github}`}
              >
                <Github size={13} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
