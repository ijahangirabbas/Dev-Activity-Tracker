'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from 'web/components/AuthProvider';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  FolderOpen,
  FileCode2,
  Terminal,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  User,
  Command,
  Loader2,
  Cloud,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { syncLocalDataToCloud } from 'web/lib/syncService';

// Import tab sub-pages to render in-place in a single dashboard layout console
import OverviewPage from 'web/app/(dashboard)/dashboard/page';
import ProjectsPage from 'web/app/(dashboard)/projects/page';
import FilesPage from 'web/app/(dashboard)/files/page';
import TerminalsPage from 'web/app/(dashboard)/terminals/page';
import SettingsPage from 'web/app/(dashboard)/settings/page';

export default function DashboardLayout() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocalOnline, setIsLocalOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedUserId, setCopiedUserId] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin?next=/dashboard', { replace: true });
    }
  }, [isLoading, navigate, user]);

  // Monitor connection to the VS Code local API server
  useEffect(() => {
    const checkLocalServer = async () => {
      try {
        const res = await fetch('http://localhost:54321/api/data');
        if (res.ok) {
          setIsLocalOnline(true);
        } else {
          setIsLocalOnline(false);
        }
      } catch (e) {
        setIsLocalOnline(false);
      }
    };

    checkLocalServer();
    const interval = setInterval(checkLocalServer, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('Connecting to local tracker...');
    try {
      const res = await fetch('http://localhost:54321/api/data');
      if (!res.ok) throw new Error('Local server offline');
      const data = await res.json();
      
      setSyncStatus('Syncing database...');
      const result = await syncLocalDataToCloud(data.db);
      if (result.success) {
        setSyncStatus(`Synced!`);
        setTimeout(() => setSyncStatus(null), 2500);
        // Dispatch event or reload to update React Query state
        window.dispatchEvent(new Event('local_sync_completed'));
        // Invalidate queries via location.reload or state update
        window.location.reload();
      } else {
        setSyncStatus(`Failed: ${result.error}`);
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch (e: any) {
      setSyncStatus(`Offline: ${e.message}`);
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyUserId = async () => {
    if (!user?.id) return;
    await navigator.clipboard.writeText(user.id);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 1800);
  };

  // Set default theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = window.document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
    setIsSidebarOpen(false);
  };

  // Command palette toggle (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-text-primary transition-colors duration-500">
        <div className="noise-overlay" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 size={36} className="animate-spin text-accent-primary" />
          <p className="text-sm text-text-secondary font-medium animate-pulse">
            {isLoading ? 'Authorizing secure workspace...' : 'Redirecting to sign in...'}
          </p>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'files', label: 'File Analytics', icon: FileCode2 },
    { id: 'terminals', label: 'Terminals & AI', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-canvas text-text-body transition-colors duration-500 relative">
      
      {/* Noise background */}
      <div className="noise-overlay" />

      {/* Mobile Sidebar overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r border-border-default bg-card-bg/70 backdrop-blur-xl z-50 transform lg:transform-none lg:static lg:flex lg:flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-default">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-primary to-accent-purple flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-text-primary">Dev Tracker</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card-hover-bg/50 border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-accent-primary' : 'text-text-secondary'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="p-4 border-t border-border-default flex flex-col gap-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card-hover-bg/30 border border-border-default">
            <div className="w-9 h-9 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
              <User size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-text-primary truncate">{user.email}</div>
              <div className="text-[10px] text-text-muted">Developer</div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-accent-red hover:bg-accent-red/5 transition cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-navbar-bg backdrop-blur-[18px] border-b border-border-default lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-text-primary capitalize">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Overview'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync status message */}
            {syncStatus && (
              <span className="hidden md:inline-block text-[10px] font-bold font-mono text-accent-primary animate-pulse bg-accent-primary/10 border border-accent-primary/15 rounded-lg px-2.5 py-1">
                {syncStatus}
              </span>
            )}

            {/* Local Server Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              isLocalOnline 
                ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' 
                : 'bg-card-bg/60 border-border-default text-text-secondary'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLocalOnline ? 'bg-accent-green animate-pulse' : 'bg-text-secondary'}`} />
              <span>{isLocalOnline ? 'Local Connected' : 'Cloud Mode'}</span>
            </div>

            {/* Manual Sync Trigger */}
            {isLocalOnline && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-accent-primary/20 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-xs font-semibold cursor-pointer active:scale-95 transition disabled:opacity-60"
                title="Synchronize local logs with Supabase"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>Sync Now</span>
              </button>
            )}

            {/* Search command shortcut */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-card-bg/60 border border-border-default text-xs text-text-secondary hover:text-text-primary hover:border-border-hover transition"
            >
              <Search size={14} />
              <span>Search Workspace...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-canvas border border-border-default font-mono text-[9px] text-text-muted">
                <Command size={8} />K
              </kbd>
            </button>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10">
          <section className="mb-6 rounded-lg border border-border-default bg-card-bg p-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                isLocalOnline
                  ? 'border-accent-green/25 bg-accent-green/10 text-accent-green'
                  : 'border-border-default bg-card-hover-bg/40 text-text-secondary'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isLocalOnline ? 'bg-accent-green' : 'bg-text-muted'}`} />
                {isLocalOnline ? 'Local Live' : 'VS Code Offline'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-accent-primary/20 bg-accent-primary/10 px-3 py-1.5 text-xs font-semibold text-accent-primary">
                <Cloud size={13} />
                Cloud Dashboard
              </span>
              <span className="inline-flex items-center rounded-lg border border-border-default bg-card-hover-bg/30 px-3 py-1.5 text-xs font-semibold text-text-secondary">
                UUID only, no service key
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 rounded-lg border border-border-default bg-canvas px-3 py-2 font-mono text-[11px] text-text-secondary">
                <span className="mr-2 text-text-muted">devActivityTracker.userId</span>
                <span className="text-text-primary">{user.id}</span>
              </div>
              <button
                type="button"
                onClick={copyUserId}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-default bg-card-hover-bg/40 px-3 py-2 text-xs font-bold text-text-primary transition hover:bg-card-hover-bg"
              >
                {copiedUserId ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                {copiedUserId ? 'Copied' : 'Copy UUID'}
              </button>
            </div>
          </section>
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'projects' && <ProjectsPage />}
          {activeTab === 'files' && <FilesPage />}
          {activeTab === 'terminals' && <TerminalsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Command Palette Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            onClick={() => setIsSearchOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-lg rounded-2xl glass-card border border-card-border p-4 shadow-2xl animate-scale-up z-10">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-border-default">
              <Search size={18} className="text-text-muted" />
              <input
                type="text"
                autoFocus
                placeholder="Search commands, projects, files..."
                className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted/60 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-1.5 py-1 rounded bg-canvas border border-border-default text-[10px] text-text-muted"
              >
                ESC
              </button>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-text-secondary">
              <div className="px-3 py-1 font-semibold text-text-muted uppercase tracking-wider">Navigation</div>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id);
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card-hover-bg/60 hover:text-text-primary text-left transition"
                >
                  <item.icon size={14} />
                  <span>Go to {item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
