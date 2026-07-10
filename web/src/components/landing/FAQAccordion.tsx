'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'Does this extension upload my raw source code?',
    answer: 'Absolutely not. The extension tracks raw time allocations and typing cadence metrics only. It never reads, copies, or uploads your actual code contents, logic strings, variables, or prompts. Additionally, if Privacy Mode is enabled, all workspace folders and file names are hashed locally before writing to disk.'
  },
  {
    question: 'Will it slow down VS Code or Cursor?',
    answer: 'Not at all. The extension is built as a lightweight background daemon. Events are debounced, and evaluation ticks occur on an asynchronous thread pool. Average CPU usage stays well under 1.5%, ensuring zero lag in your typing experience.'
  },
  {
    question: 'Can I use it entirely offline?',
    answer: 'Yes! All focus session records are cached locally first inside a structured JSON database (`db.json`) on your machine. You can view your local dashboard webview completely air-gapped. Syncing with the cloud is fully optional.'
  },
  {
    question: 'Can I export my developer analytics?',
    answer: 'Yes, you own your metrics. You can export your session timelines and summary reports as raw JSON files, clean CSV tables, or formatted Markdown files from the settings panel at any time.'
  },
  {
    question: 'Can I sync my focus records across multiple machines?',
    answer: 'Yes. By setting up a free web account, you get access to personal cloud sync backup buckets. Paste your credentials into the extension settings on each device, and it will keep your multi-machine sessions unified in the background.'
  }
];

export default function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0); // First item open by default

  return (
    <section id="faq" className="py-28 px-4 max-w-4xl mx-auto border-t border-border-default relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] radial-glow-accent pointer-events-none -z-10" />
      
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary font-sans">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-text-secondary text-sm md:text-base leading-relaxed">
          Everything you need to know about developer privacy, performance tracking, and local database sync.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={faq.question}
              className={`rounded-2xl border transition-all duration-350 overflow-hidden ${
                isOpen 
                  ? 'border-accent-primary/20 bg-accent-primary/[0.015]' 
                  : 'border-card-border bg-card-bg hover:border-card-hover-border hover:bg-card-hover-bg'
              }`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left transition-all font-semibold text-text-primary hover:text-text-primary/90 cursor-pointer select-none"
              >
                <span className="text-sm md:text-base pr-4">{faq.question}</span>
                <ChevronDown 
                  size={18} 
                  className={`text-text-muted shrink-0 transition-transform duration-350 ${
                    isOpen ? 'rotate-180 text-accent-primary' : ''
                  }`} 
                />
              </button>
              
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-6 pb-6 text-xs md:text-sm text-text-secondary leading-relaxed pt-1">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
