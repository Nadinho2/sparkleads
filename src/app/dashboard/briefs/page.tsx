'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Briefcase, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Brief {
  id: string;
  business_name: string;
  business_type: string;
  platforms: string[];
  status: string;
  created_at: string;
}

export default function BriefsPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadBriefs = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/briefs${params}`);
      const data = await res.json();
      if (data.briefs) setBriefs(data.briefs);
    } catch {
      toast.error('Failed to load briefs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadBriefs();
  }, [loadBriefs]);

  async function updateStatus(id: string, status: string) {
    try {
      await fetch('/api/briefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setBriefs((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update');
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-surface2 text-muted',
    shared: 'bg-blue-500/10 text-blue-400',
    in_production: 'bg-yellow-500/10 text-yellow-400',
    completed: 'bg-green-500/10 text-green-400',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Creative Briefs</h1>
          <p className="text-sm text-muted">Production-ready briefs for your creative team</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/briefs/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
        >
          <Plus size={16} />
          New Brief
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'shared', 'in_production', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-surface2 text-muted border border-border'
            }`}
          >
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted">Loading briefs...</p>
        </div>
      ) : briefs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-surface/50">
          <Briefcase className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">No briefs yet</p>
          <p className="text-xs text-muted">Generate your first creative brief to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase">Business</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase">Platforms</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {briefs.map((brief) => (
                <tr key={brief.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-text">{brief.business_name}</p>
                    <p className="text-xs text-muted">{brief.business_type}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {brief.platforms.map((p) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 text-muted">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={brief.status}
                      onChange={(e) => updateStatus(brief.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[brief.status] || 'bg-surface2 text-muted'}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="shared">Shared</option>
                      <option value="in_production">In Production</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted">
                    {new Date(brief.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => router.push(`/dashboard/briefs/${brief.id}`)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
