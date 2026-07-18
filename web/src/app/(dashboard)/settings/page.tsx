'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from 'web/components/AuthProvider';
import {
  Check,
  CircleDot,
  ClipboardCheck,
  Cloud,
  Copy,
  Key,
  Link2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [isLocalOnline, setIsLocalOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('Not checked yet');

  const userId = user?.id || '';

  const checkLocal = async () => {
    try {
      const res = await fetch('http://localhost:54321/api/data');
      setIsLocalOnline(res.ok);
    } catch (e) {
      setIsLocalOnline(false);
    } finally {
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  useEffect(() => {
    const savedAutoSync = localStorage.getItem('dev_tracker_auto_sync') !== 'false';
    setAutoSync(savedAutoSync);
    checkLocal();
  }, []);

  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('dev_tracker_auto_sync', checked ? 'true' : 'false');
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary">Connect VS Code</h1>
          <p className="text-xs text-text-secondary mt-1">
            Copy your UUID into the extension. That is the only cloud identifier v1.0.1 needs.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-accent-green/20 bg-accent-green/10 px-3 py-2 text-xs font-bold text-accent-green">
          <ShieldCheck size={14} />
          No service-role key required
        </div>
      </div>

      <section className="rounded-lg border border-accent-primary/20 bg-accent-primary/10 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent-primary/25 bg-accent-primary/10 text-accent-primary">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Your User Connection UUID</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Paste this value into VS Code setting <span className="font-mono text-accent-primary">devActivityTracker.userId</span>.
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 rounded-lg border border-border-default bg-canvas px-3 py-3 font-mono text-xs text-text-primary">
              {userId || 'Sign in to generate UUID'}
            </div>
            <button
              onClick={() => copyToClipboard(userId)}
              disabled={!userId}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-3 text-xs font-bold text-white transition hover:bg-accent-primary-hover disabled:opacity-60"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy UUID'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-lg border border-border-default bg-card-bg p-5">
          <div className="flex items-center justify-between gap-4 border-b border-border-default pb-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Sync Preferences</h2>
              <p className="mt-1 text-xs text-text-secondary">Cloud sync runs from the dashboard when local VS Code data is reachable.</p>
            </div>
            <Cloud size={18} className="text-accent-primary" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border-default bg-card-hover-bg/25 p-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary">Auto-sync while dashboard is open</h3>
                <p className="mt-1 text-[11px] text-text-secondary">Uploads missing local sessions to your signed-in Supabase account.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => handleAutoSyncToggle(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-border-default after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-primary peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-card-hover-bg/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold text-text-primary">VS Code local bridge</h3>
                <p className="mt-1 text-[11px] text-text-secondary">Last checked at {lastChecked}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
                  isLocalOnline
                    ? 'border-accent-green/20 bg-accent-green/10 text-accent-green'
                    : 'border-accent-amber/20 bg-accent-amber/10 text-accent-amber'
                }`}>
                  <CircleDot size={12} />
                  {isLocalOnline ? 'Local Live' : 'VS Code Offline'}
                </div>
                <button
                  type="button"
                  onClick={checkLocal}
                  className="inline-flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-xs font-bold text-text-primary transition hover:bg-card-hover-bg"
                >
                  <RefreshCw size={13} />
                  Check
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-border-default bg-card-bg p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
              <Link2 size={16} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Setup Steps</h2>
          </div>

          <div className="space-y-4">
            {[
              ['1', 'Open VS Code Settings and search Developer Activity.'],
              ['2', 'Paste your UUID into devActivityTracker.userId.'],
              ['3', 'Keep coding locally. The offline VS Code dashboard still works.'],
              ['4', 'Open this dashboard and use Sync Now when Local Live is available.'],
            ].map(([step, text]) => (
              <div key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-xs font-bold text-accent-primary">
                  {step}
                </span>
                <p className="text-xs leading-5 text-text-secondary">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border-default bg-canvas p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-text-primary">
              <ClipboardCheck size={14} className="text-accent-green" />
              Field to update
            </div>
            <div className="font-mono text-[11px] text-accent-primary">devActivityTracker.userId</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
