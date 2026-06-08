'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, TrendingUp, Send, CheckCircle, Clock } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  business_name: string;
  services: string[];
  pricing: { service: string; price: number; currency: string }[];
  status: string;
  created_at: string;
}

function getCurrencySymbol(pricing: { currency: string }[]) {
  const c = pricing?.[0]?.currency;
  if (c === 'NGN') return '₦';
  if (c === 'USD') return '$';
  if (c === 'GBP') return '£';
  return '₦';
}

function getStatusColor(status: string) {
  if (status === 'accepted') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (status === 'sent' || status === 'viewed') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (status === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/30';
  return 'bg-surface2 text-muted border-border';
}

export default function ProposalsPage() {
  const basePath = useBasePath();
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    fetch('/api/proposals')
      .then((r) => r.json())
      .then((d) => { if (d.proposals) setProposals(d.proposals); })
      .catch(() => {});
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      await fetch('/api/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update');
    }
  }

  const totalSent = proposals.filter((p) => p.status !== 'draft').length;
  const accepted = proposals.filter((p) => p.status === 'accepted').length;
  const pending = proposals.filter((p) => ['sent', 'viewed'].includes(p.status)).length;
  const conversionRate = totalSent > 0 ? Math.round((accepted / totalSent) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Proposals</h1>
          <p className="text-muted">Track and manage your client proposals.</p>
        </div>
        <Link
          href={`${basePath}/proposals/new`}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          New Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-border bg-surface">
          <p className="text-xs text-muted mb-1">Total</p>
          <p className="text-xl font-bold text-text">{proposals.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface">
          <p className="text-xs text-muted mb-1 flex items-center gap-1"><Send size={12} /> Sent</p>
          <p className="text-xl font-bold text-blue-400">{totalSent}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface">
          <p className="text-xs text-muted mb-1 flex items-center gap-1"><Clock size={12} /> Pending</p>
          <p className="text-xl font-bold text-yellow-400">{pending}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface">
          <p className="text-xs text-muted mb-1 flex items-center gap-1"><CheckCircle size={12} /> Accepted</p>
          <p className="text-xl font-bold text-green-400">{accepted}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface">
          <p className="text-xs text-muted mb-1 flex items-center gap-1"><TrendingUp size={12} /> Win Rate</p>
          <p className="text-xl font-bold text-primary">{conversionRate}%</p>
        </div>
      </div>

      {/* Table */}
      {proposals.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2">
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Business</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Services</th>
                  <th className="text-right text-xs font-medium text-muted px-4 py-3">Value</th>
                  <th className="text-center text-xs font-medium text-muted px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Date</th>
                  <th className="text-center text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const total = p.pricing?.reduce((sum, pr) => sum + pr.price, 0) || 0;
                  const sym = getCurrencySymbol(p.pricing || []);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/proposals/${p.id}`} className="text-sm font-medium text-text hover:text-primary transition-colors">
                          {p.business_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.services?.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-surface2 text-muted border border-border">{s}</span>
                          ))}
                          {(p.services?.length || 0) > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-surface2 text-muted border border-border">+{p.services.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-text">{sym}{total.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={p.status}
                          onChange={(e) => updateStatus(p.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)} bg-transparent cursor-pointer`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="viewed">Viewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/dashboard/proposals/${p.id}`} className="text-xs text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border bg-surface/50 text-center">
          <FileText className="w-12 h-12 text-muted mb-4" />
          <p className="text-lg font-medium text-text mb-2">No proposals yet</p>
          <p className="text-sm text-muted mb-4">Generate your first proposal to start winning clients</p>
          <Link
            href={`${basePath}/proposals/new`}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Create Proposal
          </Link>
        </div>
      )}
    </div>
  );
}
