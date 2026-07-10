'use client';

import React, { useState, useMemo } from 'react';
import { useSessions } from 'web/hooks/useSessions';
import { aggregateStats } from 'web/lib/dataHelpers';
import { Search, FileCode, Clock, FileEdit, Eye, AlertCircle } from 'lucide-react';

export default function FilesPage() {
  const { data: sessions, isLoading } = useSessions();
  const [search, setSearch] = useState('');

  // Aggregate files stats across all sessions
  const filesList = useMemo(() => {
    if (!sessions) return [];
    const agg = aggregateStats(sessions);
    return Object.values(agg.files).sort((a, b) => b.timeSpent - a.timeSpent);
  }, [sessions]);

  // Apply fuzzy filter
  const filteredFiles = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return filesList;
    return filesList.filter(f => f.fileName.toLowerCase().includes(q) || f.relativePath.toLowerCase().includes(q));
  }, [filesList, search]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6 py-4 animate-pulse">
        <div className="h-8 w-48 bg-border-default rounded-lg" />
        <div className="h-10 w-full max-w-sm bg-border-default rounded-lg" />
        <div className="h-96 bg-card-bg/60 border border-card-border rounded-2xl" />
      </div>
    );
  }

  const formatHrs = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary">File Analytics</h1>
        <p className="text-xs text-text-secondary mt-1">Granular analysis of individual file interactions</p>
      </div>

      {/* Filter and search */}
      <div className="relative w-full max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files by name or workspace path..."
          className="w-full bg-card-bg border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/55 transition-all"
        />
      </div>

      {/* Files Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-card-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-card-hover-bg/30 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <th className="px-6 py-4">File details</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4 text-center">Interactions (Edits / Reads)</th>
                <th className="px-6 py-4 text-right">Time Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-xs">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-text-muted" />
                      <span>No files matched the search parameters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.relativePath} className="hover:bg-card-hover-bg/35 transition-all duration-150">
                    <td className="px-6 py-4 max-w-sm sm:max-w-md md:max-w-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent-primary/5 border border-accent-primary/10 text-accent-primary shrink-0">
                          <FileCode size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary truncate">{file.fileName}</div>
                          <div className="text-[10px] text-text-muted truncate mt-0.5" title={file.relativePath}>
                            {file.relativePath}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-canvas border border-border-default font-semibold text-text-secondary text-[10px]">
                        {file.languageId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4 text-text-secondary font-medium">
                        <span className="flex items-center gap-1.5" title="Edits count">
                          <FileEdit size={12} className="text-accent-amber" />
                          <span>{file.editsCount}</span>
                        </span>
                        <span className="flex items-center gap-1.5" title="Reads count">
                          <Eye size={12} className="text-accent-cyan" />
                          <span>{file.readsCount}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-text-primary font-bold">
                        <Clock size={12} className="text-accent-primary" />
                        <span>{formatHrs(file.timeSpent)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
