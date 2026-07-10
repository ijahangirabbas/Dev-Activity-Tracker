'use client';

import React from 'react';
import { Github, Twitter, Mail, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="pb-12 px-4 md:px-8 mt-auto w-full relative bg-bg-footer transition-colors duration-500">
      {/* Detached floating footer container card */}
      <div className="max-w-6xl w-full mx-auto rounded-3xl border border-card-border bg-card-bg backdrop-blur-xl p-8 md:p-10 shadow-xl dark:shadow-black/50 flex flex-col gap-8">
        
        {/* Top Content Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          
          {/* Left Side: Brand, Intro, Socials */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-purple flex items-center justify-center shadow-md shadow-accent-primary/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-sans font-bold text-sm tracking-wider text-text-primary uppercase select-none">
                Dev<span className="text-accent-primary font-extrabold">Tracker</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              A premium, local-first analytics companion that maps your editor sessions automatically. Fully open source, secure, and offline.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4 pt-1">
              <a
                href="https://github.com/ijahangirabbas/Dev-Activity-Tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-primary transition duration-300"
                aria-label="GitHub Repository"
              >
                <Github size={16} />
              </a>
              <span
                className="text-text-muted hover:text-text-primary cursor-pointer transition duration-300"
                aria-label="Twitter Account"
              >
                <Twitter size={16} />
              </span>
              <span
                className="text-text-muted hover:text-text-primary cursor-pointer transition duration-300"
                aria-label="Discord Server"
              >
                <MessageSquare size={16} />
              </span>
              <span
                className="text-text-muted hover:text-text-primary cursor-pointer transition duration-300"
                aria-label="Email Support"
              >
                <Mail size={16} />
              </span>
            </div>
          </div>

          {/* Right Side: Horizontal Links List */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              About Us
            </span>
            <span className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Contact Us
            </span>
            <span className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Terms of Service
            </span>
          </div>

        </div>

        {/* Bottom Copyright Row inside the detached box */}
        <div className="pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-muted">
          <div>
            &copy; {new Date().getFullYear()} Jeem Labs. All rights reserved. Designed for privacy-first developers.
          </div>
          <div className="flex items-center gap-1">
            Built with <span className="text-rose-500 animate-pulse">❤️</span> for the engineering community.
          </div>
        </div>

      </div>
    </footer>
  );
}
