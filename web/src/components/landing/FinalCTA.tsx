'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-accent-primary/20 via-accent-purple/20 to-accent-cyan/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="relative rounded-3xl border border-border-default bg-card-bg/50 p-8 sm:p-12 md:p-16 text-center max-w-5xl mx-auto shadow-xl dark:shadow-2xl overflow-hidden">
        
        {/* Glow spotlight behind title */}
        <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-accent-primary/10 blur-[90px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-primary">
            Boost Your Focus Efficiency
          </span>
          
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-primary font-sans">
            Ready to Understand How You Actually Code?
          </h2>
          
          <p className="text-text-body text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Install the extension in one click. Take control of your developer focus blocks, and sync securely with zero setup overhead.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary text-white font-bold text-sm shadow-xl shadow-accent-primary/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              Install the Extension
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://github.com/ijahangirabbas/Dev-Activity-Tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-border-default bg-card-bg hover:bg-card-hover-bg font-bold text-sm text-text-secondary hover:text-text-primary transition-all duration-300 hover:border-border-hover cursor-pointer"
            >
              <svg className="w-4 h-4 text-accent-primary" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clipRule="evenodd" /></svg>
              <span>Explore GitHub</span>
            </a>
          </div>

          <div className="pt-6 text-[10px] text-text-muted flex items-center justify-center gap-6 flex-wrap">
            <span>⚡ MIT Open Source License</span>
            <span>•</span>
            <span>🔒 100% Local-First Heuristics</span>
            <span>•</span>
            <span>🚀 Under 2% CPU footprint</span>
          </div>

        </div>

      </div>
    </section>
  );
}
