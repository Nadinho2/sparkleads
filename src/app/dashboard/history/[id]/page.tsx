'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Copy,
  ExternalLink,
  Check,
  Calendar,
  StickyNote,
  Plus,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { Spinner } from '@/components/ui';
import { NotesPanel } from '@/components/dashboard/NotesPanel';
import { WhatsAppComposer } from '@/components/dashboard/WhatsAppComposer';
import { EmailComposer } from '@/components/dashboard/EmailComposer';
import type { Lead, Search } from '@/types';

type LeadStatus = Lead['status'];

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'closed', label: 'Closed' },
  { value: 'not_interested', label: 'Not Interested' },
];

export default function SearchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const basePath = useBasePath();
  const router = useRouter();
  const [search, setSearch] = useState<Search | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notesPanel, setNotesPanel] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [whatsappComposer, setWhatsappComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [emailComposer, setEmailComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });

  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch(`/api/searches/${id}/leads`);
        if (!response.ok) {
          router.push(`${basePath}/history`);
          return;
        }
        const data = await response.json();
        setSearch(data.search);
        setLeads(data.leads);

        if (data.leads.length > 0) {
          const noteRes = await fetch('/api/notes/bulk-get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_ids: data.leads.map((l: Lead) => l.id) }),
          });
          const { notes } = await noteRes.json();
          if (notes) {
            setLeads((prev) =>
              prev.map((lead) => ({
                ...lead,
                note: notes[lead.id] || null,
              }))
            );
          }
        }
      } catch {
        router.push(`${basePath}/history`);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [id, router, basePath]);

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status }),
      });
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
      );
    } catch {
      // Silent fail
    }
  }, []);

  const handleCopyPhone = useCallback(async (phone: string, leadId: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Silent fail
    }
  }, []);

  const handleNoteSaved = useCallback((leadId: string, content: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, note: content } : l))
    );
    setNotesPanel((prev) => ({
      ...prev,
      lead: prev.lead?.id === leadId ? { ...prev.lead, note: content } : prev.lead,
    }));
  }, []);

  const handleNoteDeleted = useCallback((leadId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, note: null } : l))
    );
    setNotesPanel((prev) => ({
      ...prev,
      lead: prev.lead?.id === leadId ? { ...prev.lead, note: null } : prev.lead,
    }));
  }, []);

  const handleExportCsv = useCallback(async () => {
    if (leads.length === 0) return;

    try {
      const response = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, query: search?.query || 'leads' }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sparkleads-${(search?.query || 'leads').replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail
    }
  }, [leads, search]);

  const cleanPhone = (phone: string | null): string | null => {
    if (!phone) return null;
    return phone.replace(/[^+\d]/g, '');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push(`${basePath}/history`)}
            className="flex items-center gap-2 text-sm text-muted hover:text-text mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </button>
          <h2 className="text-xl font-bold text-text">{search?.query}</h2>
          {search && (
            <div className="flex items-center gap-3 mt-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(search.created_at)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {leads.length} leads
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleExportCsv}
          disabled={leads.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">No leads found for this search.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Website
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-surface2/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted">{i + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-text">
                      {lead.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {lead.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {lead.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {lead.website
                            .replace(/^https?:\/\/(www\.)?/, '')
                            .slice(0, 30)}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.rating ? (
                        <span className="text-warning">{lead.rating} ★</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(
                            lead.id,
                            e.target.value as LeadStatus
                          )
                        }
                        className="bg-transparent border border-border rounded-lg px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                      >
                        {statusOptions.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-surface text-text"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {lead.note ? (
                        <button
                          onClick={() => setNotesPanel({ isOpen: true, lead })}
                          className="group flex items-start gap-2 text-left w-full max-w-[200px]"
                        >
                          <StickyNote size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-muted group-hover:text-text transition-colors truncate">
                            {lead.note}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setNotesPanel({ isOpen: true, lead })}
                          className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                        >
                          <Plus size={12} />
                          Add note
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {lead.phone && cleanPhone(lead.phone) && (
                          <a
                            href={`https://wa.me/${cleanPhone(lead.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        {lead.phone && (
                          <button
                            onClick={() =>
                              handleCopyPhone(lead.phone!, lead.id)
                            }
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Copy phone"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Visit website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NotesPanel
        lead={notesPanel.lead}
        isOpen={notesPanel.isOpen}
        onClose={() => setNotesPanel({ isOpen: false, lead: null })}
        onNoteSaved={handleNoteSaved}
        onNoteDeleted={handleNoteDeleted}
        onMarkContacted={(leadId) => handleStatusChange(leadId, 'contacted')}
      />

      <WhatsAppComposer
        lead={whatsappComposer.lead}
        isOpen={whatsappComposer.isOpen}
        onClose={() => setWhatsappComposer({ isOpen: false, lead: null })}
        onSent={() => {}}
      />

      <EmailComposer
        lead={emailComposer.lead}
        isOpen={emailComposer.isOpen}
        onClose={() => setEmailComposer({ isOpen: false, lead: null })}
        onSent={() => {}}
      />
    </div>
  );
}
