'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  MessageCircle,
  Copy,
  ExternalLink,
  Check,
  BarChart3,
} from 'lucide-react';
import { Spinner } from '@/components/ui';
import type { Lead } from '@/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    const sessionId = localStorage.getItem('sparkleads_session_id');
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/leads?user_token=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${cleaned.startsWith('+') ? cleaned.slice(1) : cleaned}`, '_blank');
  };

  const exportCSV = async () => {
    try {
      const res = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: filteredLeads }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sparkleads-all-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch =
      !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">My Leads</h1>
          <p className="text-sm text-muted mt-1">
            {leads.length} total leads across all searches
          </p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export All CSV
          </button>
        )}
      </div>

      {leads.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-xl border border-border bg-surface text-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="closed">Closed</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No leads yet</h3>
          <p className="text-muted">
            Run a search from the dashboard to start collecting leads.
          </p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted">No leads match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">#</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Business Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Website</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Address</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Rating</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Reviews</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className="border-b border-border/50 hover:bg-surface2/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-muted">{index + 1}</td>
                  <td className="py-3 px-4 text-sm text-text font-medium">
                    {lead.name}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {lead.phone ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-text hover:text-primary transition-colors"
                        >
                          {lead.phone}
                        </a>
                        <button
                          onClick={() => copyPhone(lead.phone!)}
                          className="text-muted hover:text-primary transition-colors"
                          title="Copy phone"
                        >
                          {copiedPhone === lead.phone ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-primary hover:underline"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Visit
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted max-w-[200px] truncate">
                    {lead.address || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {lead.rating ? (
                      <span className="text-warning">{lead.rating} ★</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted">
                    {lead.reviews ? `${lead.reviews} reviews` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === 'new' ? 'bg-primary/10 text-primary' :
                      lead.status === 'contacted' ? 'bg-warning/10 text-warning' :
                      lead.status === 'interested' ? 'bg-success/10 text-success' :
                      lead.status === 'closed' ? 'bg-success/20 text-success' :
                      'bg-surface2 text-muted'
                    }`}>
                      {lead.status === 'not_interested' ? 'Not Interested' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {lead.phone && (
                      <button
                        onClick={() => openWhatsApp(lead.phone!)}
                        className="text-muted hover:text-success transition-colors"
                        title="Open WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
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
