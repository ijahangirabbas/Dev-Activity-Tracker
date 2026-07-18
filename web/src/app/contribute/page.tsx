'use client';

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bug,
  Code2,
  Github,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const contributionTracks = [
  {
    title: 'Report Bugs',
    body: 'Share extension crashes, sync problems, dashboard data mismatches, or confusing onboarding flows.',
    icon: Bug,
  },
  {
    title: 'Improve Tracking',
    body: 'Help refine coding, reading, terminal, git, test, and AI activity classification.',
    icon: Code2,
  },
  {
    title: 'Harden Privacy',
    body: 'Review local storage, webview rendering, sync payloads, and privacy-mode behavior.',
    icon: ShieldCheck,
  },
  {
    title: 'Shape UX',
    body: 'Suggest clearer dashboard states for Local Live, Cloud Synced, Demo Data, and VS Code Offline.',
    icon: MessageSquare,
  },
];

export default function ContributePage() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = window.document.documentElement;
    root.classList.toggle('dark', savedTheme === 'dark');
    root.classList.toggle('light', savedTheme !== 'dark');
  }, []);

  return (
    <main className="min-h-screen bg-canvas text-text-body relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 mesh-grid pointer-events-none opacity-50" />

      <header className="relative z-10 border-b border-border-default bg-navbar-bg backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary text-white">
              <Sparkles size={18} />
            </span>
            <span className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Dev Tracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/signin"
              className="hidden rounded-lg border border-border-default px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-accent-primary-hover"
            >
              Dashboard
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-accent-green/20 bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
            <HeartHandshake size={14} />
            Open collaboration for v1.0.1+
          </div>
          <h1 className="text-4xl font-bold leading-tight text-text-primary md:text-5xl">
            Help make developer activity tracking trustworthy, calm, and useful.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-text-secondary">
            The next version focuses on secure webview rendering, a safer local bridge, clearer cloud sync, and dashboard UX that tells users exactly where their data is coming from.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://github.com/ijahangirabbas/Dev-Activity-Tracker"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-primary-hover"
            >
              <Github size={16} />
              Open GitHub
            </a>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-border-default px-5 py-3 text-sm font-bold text-text-primary transition hover:bg-card-hover-bg"
            >
              Create test account
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {contributionTracks.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-border-default bg-card-bg p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                  <Icon size={18} />
                </div>
                <h2 className="text-base font-bold text-text-primary">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{item.body}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-10 rounded-lg border border-border-default bg-card-bg p-6">
          <h2 className="text-lg font-bold text-text-primary">v1.0.1 contribution checklist</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              'Test /signin, /signup, /dashboard, and /contribute on Vercel.',
              'Confirm UUID-only extension pairing works from dashboard Settings.',
              'Verify local VS Code dashboard still works offline.',
            ].map((task) => (
              <div key={task} className="rounded-lg border border-border-default bg-canvas p-4 text-sm text-text-secondary">
                {task}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
