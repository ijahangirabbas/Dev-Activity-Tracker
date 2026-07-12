'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from 'web/components/AuthProvider';
import { Copy, Check, ShieldAlert, Key, Link2, Sparkles, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [isLocalOnline, setIsLocalOnline] = useState(false);

  const userId = user?.id || '';

  // Load autoSync setting from localStorage on mount
  useEffect(() => {
    const savedAutoSync = localStorage.getItem('dev_tracker_auto_sync') !== 'false';
    setAutoSync(savedAutoSync);

    // Check local server
    const checkLocal = async () => {
      try {
        const res = await fetch('http://localhost:54321/api/data');
        setIsLocalOnline(res.ok);
      } catch (e) {
        setIsLocalOnline(false);
      }
    };
    checkLocal();
  }, []);

  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('dev_tracker_auto_sync', checked ? 'true' : 'false');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary">Sync & Integration Settings</h1>
        <p className="text-xs text-text-secondary mt-1">Configure connection between VS Code and your personal cloud profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Credentials and Preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* User ID block */}
          <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Your Cloud Credentials</h3>
                <p className="text-xs text-text-secondary mt-1">Use this ID to pair your local VS Code extension</p>
              </div>
              <div className="p-2.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                <Key size={16} />
              </div>
            </div>

            <div className="space-y-4">
              {/* User ID */}
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">User Connection Key (UUID)</label>
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
            </div>
          </div>

          {/* Cloud Sync Preferences */}
          <div className="p-6 rounded-2xl glass-card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Synchronization Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card-hover-bg/30 border border-border-default">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Auto-Sync to Cloud</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">Automatically sync local sessions when dashboard is open</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoSync} 
                    onChange={(e) => handleAutoSyncToggle(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-border-default rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-card-hover-bg/30 border border-border-default">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Connection Status</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">Communication link with localhost tracker server</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                  isLocalOnline 
                    ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' 
                    : 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLocalOnline ? 'bg-accent-green' : 'bg-accent-amber'}`} />
                  <span>{isLocalOnline ? 'Online' : 'Offline / Idle'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Setup Instructions */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass-card space-y-6">
          <div className="flex items-center gap-3 border-b border-border-default pb-4 mb-4">
            <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              <Link2 size={16} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Setup Instructions</h3>
          </div>

          <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">1</span>
              <span>Open your VS Code Settings using shortcut <kbd className="px-1 py-0.5 bg-canvas border border-border-default rounded text-[9px]">Ctrl + ,</kbd> or <kbd className="px-1 py-0.5 bg-canvas border border-border-default rounded text-[9px]">Cmd + ,</kbd>.</span>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">2</span>
              <span>Search for **&quot;Developer Activity&quot;** configurations.</span>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">3</span>
              <div className="space-y-1">
                <span>Copy and paste your **User Connection Key** from this page into:</span>
                <div className="font-mono text-[10px] text-accent-primary bg-card-bg/60 border border-border-default rounded-lg px-2 py-1.5 mt-1 block">
                  devActivityTracker.userId
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary shrink-0 select-none">4</span>
              <span>Your local code tracking sessions will now sync to this cloud dashboard automatically in the background when it is open!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
