'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  Eye,
  RotateCcw,
  Trash2,
  History,
} from 'lucide-react';
import { Spinner } from '@/components/ui';
import type { Search as SearchType } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SearchType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSearches = useCallback(async () => {
    const sessionId = localStorage.getItem('sparkleads_session_id');
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/searches?user_token=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      setSearches(data.searches || []);
    } catch (err) {
      console.error('Failed to load searches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const handleDelete = useCallback(async (searchId: string) => {
    setDeletingId(searchId);

    try {
      const response = await fetch('/api/searches/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      });

      if (response.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== searchId));
      }
    } catch {
      // Silent fail
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleReRun = useCallback(
    (query: string) => {
      router.push(`/dashboard?q=${encodeURIComponent(query)}`);
    },
    [router]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-6">
          <History className="w-10 h-10 text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">No search history</h2>
        <p className="text-muted mb-6">Your searches will appear here</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <Search className="w-5 h-5" />
          Start Searching
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searches.map((search) => (
        <div
          key={search.id}
          className="p-5 rounded-xl border border-border bg-surface hover:border-primary/30 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text mb-1.5 truncate">
                {search.query}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(search.created_at)} at {formatTime(search.created_at)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {search.result_count} results
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/history/${search.id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface2 text-sm text-muted hover:text-text hover:border-primary/50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Leads
              </button>
              <button
                onClick={() => handleReRun(search.query)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface2 text-sm text-muted hover:text-primary hover:border-primary/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Re-run
              </button>
              <button
                onClick={() => handleDelete(search.id)}
                disabled={deletingId === search.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface2 text-sm text-muted hover:text-danger hover:border-danger/50 transition-colors disabled:opacity-50"
              >
                {deletingId === search.id ? (
                  <Spinner size="sm" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
