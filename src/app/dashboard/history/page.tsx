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
  Globe,
  MapPin,
  BarChart2,
  Users,
  FileText,
  Megaphone,
  MessageSquare,
  PenTool,
  Briefcase,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { Spinner } from '@/components/ui';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  credits: number;
  created_at: string;
  link?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  search: { label: 'Lead Search', icon: <Search size={16} />, color: 'bg-blue-500/10 text-blue-400' },
  grade: { label: 'Website Grade', icon: <Globe size={16} />, color: 'bg-green-500/10 text-green-400' },
  gbp: { label: 'GBP Audit', icon: <MapPin size={16} />, color: 'bg-yellow-500/10 text-yellow-400' },
  report: { label: 'Full Audit', icon: <BarChart2 size={16} />, color: 'bg-purple-500/10 text-purple-400' },
  competitor: { label: 'Competitors', icon: <Users size={16} />, color: 'bg-orange-500/10 text-orange-400' },
  proposal: { label: 'Proposal', icon: <FileText size={16} />, color: 'bg-pink-500/10 text-pink-400' },
  ad: { label: 'Ad Plan', icon: <Megaphone size={16} />, color: 'bg-cyan-500/10 text-cyan-400' },
  message: { label: 'AI Message', icon: <MessageSquare size={16} />, color: 'bg-indigo-500/10 text-indigo-400' },
  content: { label: 'Content', icon: <PenTool size={16} />, color: 'bg-teal-500/10 text-teal-400' },
  brief: { label: 'Brief', icon: <Briefcase size={16} />, color: 'bg-rose-500/10 text-rose-400' },
};

const FILTER_OPTIONS = [
  { value: '', label: 'All Activity' },
  { value: 'search', label: 'Searches' },
  { value: 'grade', label: 'Website Grades' },
  { value: 'gbp', label: 'GBP Audits' },
  { value: 'report', label: 'Full Audits' },
  { value: 'competitor', label: 'Competitors' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'ad', label: 'Ad Plans' },
  { value: 'message', label: 'AI Messages' },
  { value: 'content', label: 'Content' },
  { value: 'brief', label: 'Briefs' },
];

export default function HistoryPage() {
  const basePath = useBasePath();
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter) params.set('type', activeFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/history/all?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = useCallback(async (itemId: string, itemType: string) => {
    if (itemType !== 'search') return; // only searches can be deleted
    setDeletingId(itemId);

    try {
      const response = await fetch('/api/searches/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId: itemId }),
      });

      if (response.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch {
      // Silent fail
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleReRun = useCallback(
    (query: string) => {
      router.push(`${basePath}?q=${encodeURIComponent(query)}`);
    },
    [router, basePath]
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

  const totalCredits = items.reduce((sum, item) => sum + item.credits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Activity History</h1>
          <p className="text-sm text-muted mt-1">
            All your service usage and credit consumption in one place
          </p>
        </div>
        {!loading && items.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface2 border border-border">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-medium text-text">{totalCredits}</span>
            <span className="text-xs text-muted">credits used</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={16} className="text-muted flex-shrink-0" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === opt.value
                ? 'bg-primary text-white'
                : 'bg-surface2 text-muted hover:text-text hover:bg-surface2/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-6">
            <History className="w-10 h-10 text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            {activeFilter ? `No ${FILTER_OPTIONS.find((f) => f.value === activeFilter)?.label.toLowerCase() || 'items'} yet` : 'No activity yet'}
          </h2>
          <p className="text-muted mb-6">
            {activeFilter ? 'Try a different filter or use a service first' : 'Your service usage will appear here'}
          </p>
          <button
            onClick={() => {
              setActiveFilter('');
              router.push(`${basePath}`);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Search className="w-5 h-5" />
            Start Searching
          </button>
        </div>
      )}

      {/* Activity list */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.search;
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="p-4 rounded-xl border border-border bg-surface hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Type icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                        <Sparkles size={10} />
                        {item.credits} credit{item.credits !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-text truncate">{item.title}</h3>
                    {item.subtitle && (
                      <p className="text-xs text-muted mt-0.5">{item.subtitle}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.created_at)} at {formatTime(item.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.type === 'search' && (
                      <>
                        <button
                          onClick={() => router.push(`${basePath}/history/${item.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface2 text-xs text-muted hover:text-text hover:border-primary/50 transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleReRun(item.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface2 text-xs text-muted hover:text-primary hover:border-primary/50 transition-colors"
                        >
                          <RotateCcw size={14} />
                          Re-run
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.type)}
                          disabled={deletingId === item.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface2 text-xs text-muted hover:text-danger hover:border-danger/50 transition-colors disabled:opacity-50"
                        >
                          {deletingId === item.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                        </button>
                      </>
                    )}
                    {item.type !== 'search' && item.link && (
                      <button
                        onClick={() => router.push(`${basePath}${item.link}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface2 text-xs text-muted hover:text-text hover:border-primary/50 transition-colors"
                      >
                        <Eye size={14} />
                        Open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
