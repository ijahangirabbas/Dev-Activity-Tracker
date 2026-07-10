'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'web/components/AuthProvider';
import { LayoutDashboard, Sun, Moon, Github } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Header({ theme, toggleTheme }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
      <div className="w-full max-w-6xl rounded-full border border-navbar-border bg-navbar-bg backdrop-blur-[18px] px-6 md:px-8 py-3.5 flex items-center justify-between shadow-lg dark:shadow-black/50 pointer-events-auto transition-all duration-500 hover:border-border-hover">
        
        {/* Brand Logo with Custom SVG Icon */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-purple flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 shadow-lg shadow-accent-primary/20">
            {/* Geometric SVG Icon */}
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-white group-hover:scale-110 transition-transform duration-300"
            >
              <path 
                d="M12 2L2 7L12 12L22 7L12 2Z" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 17L12 22L22 17" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="opacity-60"
              />
              <path 
                d="M2 12L12 17L22 12" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="opacity-80"
              />
            </svg>
            <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-sans font-bold text-sm tracking-wider text-text-primary uppercase select-none group-hover:text-text-primary/90 transition-colors">
            Dev<span className="text-accent-primary font-extrabold">Tracker</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-300 relative py-1 group">
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#workflow" className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-300 relative py-1 group">
            Workflow
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#showcase" className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-300 relative py-1 group">
            Showcase
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#pricing" className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-300 relative py-1 group">
            Pricing
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#faq" className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-300 relative py-1 group">
            FAQ
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-primary transition-all duration-300 group-hover:w-full" />
          </a>
        </nav>

        {/* Right Section CTAs */}
        <div className="flex items-center gap-4">
          
          {/* GitHub Star Badge */}
          <a
            href="https://github.com/ijahangirabbas/Dev-Activity-Tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-card-bg hover:bg-card-hover-bg text-[11px] font-bold text-text-secondary hover:text-text-primary transition duration-300"
          >
            <Github size={13} className="text-accent-primary" />
            <span>GitHub</span>
            <span className="h-3 w-px bg-border-default" />
            <span className="text-accent-primary">★ 1.2k</span>
          </a>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border-default bg-card-bg hover:bg-card-hover-bg text-text-secondary hover:text-text-primary transition duration-300 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-accent-primary" />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent-primary to-accent-primary-hover active:scale-95 text-xs font-bold text-white transition-all shadow-lg shadow-accent-primary/20 cursor-pointer"
            >
              <LayoutDashboard size={13} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3.5">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-border-default bg-card-bg hover:bg-card-hover-bg text-xs font-bold text-text-primary hover:text-accent-primary transition cursor-pointer"
              >
                Sign In
              </Link>
              
              <Link
                to="/signup"
                className="relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full font-bold group cursor-pointer"
              >
                {/* Conic-gradient spin border mask covering full 360 degrees */}
                <span className="absolute inset-[-100%] m-auto aspect-square bg-[conic-gradient(from_0deg,var(--accent-primary)_0%,var(--accent-purple)_35%,var(--accent-cyan)_70%,var(--accent-primary)_100%)] rounded-full animate-spin-border" />
                {/* Content mask */}
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-canvas rounded-full text-text-primary text-xs font-bold hover:bg-card-hover-bg flex items-center gap-1">
                  Get Started
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
