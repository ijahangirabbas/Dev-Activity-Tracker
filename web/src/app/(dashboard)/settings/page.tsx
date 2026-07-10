'use client';

import React, { useState } from 'react';
import { useAuth } from 'web/components/AuthProvider';
import { Copy, Check, ShieldAlert, Key, Link2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
  const userId = user?.id || '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary">Sync Settings</h1>
        <p className="text-xs text-text-secondary mt-1">Configure your local VS Code extension to push activity data to the cloud</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Credentials */}
        <div className="lg:col-span-2 space-y-6">
          {/* User ID block */}
          <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Your Auth Credentials</h3>
                <p className="text-xs text-text-secondary mt-1">Use these credentials in your VS Code configuration settings</p>
              </div>
              <div className="p-2.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                <Key size={16} />
              </div>
            </div>

            <div className="space-y-4">
              {/* User ID */}
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">Supabase Auth User ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={userId}
                    className="flex-1 bg-card-bg/60 border border-border-default rounded-xl px-4 py-3 text-xs font-mono text-text-primary focus:outline-none select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(userId)}
                    className="px-4 py-3 rounded-xl glass-card border border-border-default hover:bg-card-hover-bg/60 text-text-secondary active:scale-95 transition cursor-pointer shrink-0"
                  >
                    {copied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Supabase URL */}
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">Supabase Database URL</label>
                <input
                  type="text"
                  readOnly
                  value={supabaseUrl}
                  className="w-full bg-card-bg/60 border border-border-default rounded-xl px-4 py-3 text-xs font-mono text-text-secondary focus:outline-none select-all"
                />
              </div>
            </div>
          </div>

          {/* Security details alert */}
          <div className="p-5 rounded-2xl bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs flex gap-3 leading-relaxed">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Important Security Notice</span>
              <span>
                To configure writing data from VS Code, you must specify your Supabase `service_role` key inside VS Code.
                **Never upload this service role key to this website or commit it to any public repositories.** It must remain secret and resides securely on your local IDE client only.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Setup Instructions */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card space-y-6">
          <div className="flex items-center gap-3 border-b border-border-default pb-4 mb-4">
            <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Link2 size={16} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Integration Steps</h3>
          </div>

          <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">1</span>
              <span>Open your VS Code Settings using shortcut <kbd className="px-1 py-0.5 bg-canvas border border-border-default rounded text-[9px]">Ctrl + ,</kbd> or <kbd className="px-1 py-0.5 bg-canvas border border-border-default rounded text-[9px]">Cmd + ,</kbd>.</span>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">2</span>
              <span>Search for **&quot;Developer Activity&quot;** to view configurations.</span>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">3</span>
              <div className="space-y-1">
                <span>Copy and paste the credentials from this page:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-text-muted">
                  <li>`supabaseUrl`</li>
                  <li>`supabaseUserId`</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">4</span>
              <span>Paste your Supabase API `service_role` key into `supabaseServiceKey`.</span>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">5</span>
              <span>Open command palette and run **&quot;Sync Data to Cloud (Supabase)&quot;** to upload.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
