'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Star, Copy, Check,
  MessageCircle, Mail, Bell, StickyNote, ExternalLink, X,
  Sparkles, BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useSearchStream } from '@/hooks/useSearchStream';
import { Spinner } from '@/components/ui';
import { WhatsAppComposer } from '@/components/dashboard/WhatsAppComposer';
import { EmailComposer } from '@/components/dashboard/EmailComposer';
import { FollowUpModal } from '@/components/dashboard/FollowUpModal';
import { NotesPanel } from '@/components/dashboard/NotesPanel';
import { OpportunityModal } from '@/components/dashboard/OpportunityModal';
import type { Lead } from '@/types';

type LeadStatus = Lead['status'];

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'contacted', label: 'Contacted', color: 'text-yellow-400 bg-yellow-500/10' },
  { value: 'interested', label: 'Interested', color: 'text-green-400 bg-green-500/10' },
  { value: 'closed', label: 'Closed', color: 'text-purple-400 bg-purple-500/10' },
  { value: 'not_interested', label: 'Not Interested', color: 'text-red-400 bg-red-500/10' },
];

export default function AgencySearchPage() {
  const [query, setQuery] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());
  const [whatsappComposer, setWhatsappComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [emailComposer, setEmailComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [followUpModal, setFollowUpModal] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [notesPanel, setNotesPanel] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Freelancer opportunity scores
  const [freelancerType, setFreelancerType] = useState('');
  const [leadOpportunityScores, setLeadOpportunityScores] = useState<Record<string, {
    score: number; label: string; opportunity: 'high' | 'medium' | 'low';
    details: Record<string, unknown> | null; loading: boolean;
  }>>({});
  const [opportunityModal, setOpportunityModal] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [filterHighOpportunity, setFilterHighOpportunity] = useState(false);

  const { leads, isSearching, error, search, reset, updateLead } = useSearchStream({
    sessionId,
    isPaid: true,
  });

  useEffect(() => {
    let id = localStorage.getItem('sparkleads_session_id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('sparkleads_session_id', id); }
    setSessionId(id);
    setFreelancerType(localStorage.getItem('sparkleads_freelancer_type') || '');
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;
    setLeadOpportunityScores({});
    await search(query);
  }, [query, isSearching, search]);

  const handleClear = useCallback(() => {
    reset();
    setQuery('');
    setLeadOpportunityScores({});
  }, [reset]);

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) updateLead(lead.place_id, { status });
    try {
      const res = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status }),
      });
      if (!res.ok && lead) updateLead(lead.place_id, { status: 'new' as LeadStatus });
    } catch {
      if (lead) updateLead(lead.place_id, { status: 'new' as LeadStatus });
    }
  }, [leads, updateLead]);

  const handleCopyPhone = useCallback(async (phone: string, leadId: string) => {
    try { await navigator.clipboard.writeText(phone); setCopiedId(leadId); setTimeout(() => setCopiedId(null), 2000); } catch { /* */ }
  }, []);

  const handleCopyEmail = useCallback(async (email: string, leadId: string) => {
    try { await navigator.clipboard.writeText(email); setCopiedEmailId(leadId); setTimeout(() => setCopiedEmailId(null), 2000); } catch { /* */ }
  }, []);

  const manualScrapeEmail = useCallback(async (lead: Lead) => {
    if (!lead.website) return;
    setScanningIds((prev) => new Set(prev).add(lead.place_id));
    try {
      const res = await fetch('/api/scrape-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lead.website }),
      });
      const { email } = await res.json();
      if (email) updateLead(lead.place_id, { email });
    } catch { /* */ }
    finally { setScanningIds((prev) => { const n = new Set(prev); n.delete(lead.place_id); return n; }); }
  }, [updateLead]);

  const checkOpportunity = useCallback(async (lead: Lead) => {
    if (!lead.website || leadOpportunityScores[lead.place_id] || !freelancerType) return;
    setLeadOpportunityScores((prev) => ({ ...prev, [lead.place_id]: { score: 0, label: '', opportunity: 'medium', details: null, loading: true } }));
    try {
      const res = await fetch('/api/audit/freelancer-score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, freelancerType }),
      });
      const data = await res.json();
      if (res.ok) setLeadOpportunityScores((prev) => ({ ...prev, [lead.place_id]: { ...data, loading: false } }));
      else { setLeadOpportunityScores((prev) => { const n = { ...prev }; delete n[lead.place_id]; return n; }); }
    } catch { setLeadOpportunityScores((prev) => { const n = { ...prev }; delete n[lead.place_id]; return n; }); }
  }, [freelancerType, leadOpportunityScores]);

  // Auto-scan opportunity when not searching
  useEffect(() => {
    if (isSearching || !freelancerType || leads.length === 0) return;
    const unscored = leads.filter((l) => l.website && !leadOpportunityScores[l.place_id]);
    if (unscored.length === 0) return;
    const t = setTimeout(async () => {
      for (const lead of unscored.slice(0, 5)) {
        await checkOpportunity(lead);
        await new Promise((r) => setTimeout(r, 400));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [isSearching, freelancerType, leads, leadOpportunityScores, checkOpportunity]);

  const handleWhatsAppSent = useCallback((placeId: string) => updateLead(placeId, { status: 'contacted' }), [updateLead]);
  const handleEmailSent = useCallback((placeId: string) => updateLead(placeId, { status: 'contacted' }), [updateLead]);
  const handleReminderSaved = useCallback((placeId: string) => updateLead(placeId, { hasReminder: true }), [updateLead]);
  const handleNoteSaved = useCallback((leadId: string) => {
    updateLead(leads.find((l) => l.id === leadId)?.place_id || '', { });
  }, [leads, updateLead]);
  const handleNoteDeleted = useCallback((leadId: string) => {
    updateLead(leads.find((l) => l.id === leadId)?.place_id || '', { note: null });
  }, [leads, updateLead]);

  const displayLeads = filterHighOpportunity
    ? leads.filter((l) => leadOpportunityScores[l.place_id]?.opportunity === 'high')
    : leads;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text">Lead Search</h1>
        <p className="text-sm text-muted">Searches are shared with all team members.</p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. restaurants in Lagos, plumbers in Lekki"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />}
            Search
          </button>
          {leads.length > 0 && (
            <button onClick={handleClear} className="px-4 py-3 rounded-xl bg-surface2 text-muted hover:text-text border border-border">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      {leads.length > 0 && !isSearching && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted">{displayLeads.length} results</span>
          {freelancerType && (
            <button
              onClick={() => setFilterHighOpportunity(!filterHighOpportunity)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filterHighOpportunity
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted hover:border-primary/50'
              }`}
            >
              <Sparkles size={12} className="inline mr-1" />
              High Opportunity Only
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-muted">Searching...</p>
        </div>
      )}

      {/* Error */}
      {error && !isSearching && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* No results */}
      {!isSearching && !error && leads.length > 0 && displayLeads.length === 0 && (
        <div className="text-center py-10 text-muted">No high opportunity leads found.</div>
      )}

      {/* Results */}
      {!isSearching && displayLeads.length > 0 && (
        <div className="space-y-2">
          {displayLeads.map((lead) => {
            const opp = leadOpportunityScores[lead.place_id];
            const isExpanded = expandedId === lead.place_id;

            return (
              <div
                key={lead.id || lead.place_id}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                {/* Main row */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text truncate">{lead.name}</h3>
                        {/* Opportunity badge */}
                        {opp && !opp.loading && (
                          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            opp.opportunity === 'high' ? 'bg-green-500/20 text-green-400' :
                            opp.opportunity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-surface2 text-muted'
                          }`}>
                            {opp.score}%
                          </span>
                        )}
                        {opp?.loading && <Spinner size="sm" />}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                        {lead.address && <span className="truncate max-w-[200px]">{lead.address}</span>}
                        {lead.rating && <span className="flex items-center gap-1 shrink-0"><Star size={11} className="text-yellow-400" />{lead.rating}</span>}
                        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] ${
                          statusOptions.find((s) => s.value === lead.status)?.color || 'bg-surface2 text-muted'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {lead.phone && (
                        <button onClick={() => handleCopyPhone(lead.phone!, lead.id)} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text" title="Copy phone">
                          {copiedId === lead.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                      )}
                      {lead.email && (
                        <button onClick={() => handleCopyEmail(lead.email!, lead.id)} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text" title="Copy email">
                          {copiedEmailId === lead.id ? <Check size={14} className="text-green-400" /> : <Mail size={14} />}
                        </button>
                      )}
                      {lead.website && !lead.email && (
                        <button onClick={() => manualScrapeEmail(lead)} disabled={scanningIds.has(lead.place_id)} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text" title="Find email">
                          {scanningIds.has(lead.place_id) ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                        </button>
                      )}
                      {lead.phone && (
                        <button onClick={() => setWhatsappComposer({ isOpen: true, lead })} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-green-400" title="WhatsApp">
                          <MessageCircle size={14} />
                        </button>
                      )}
                      {lead.email && (
                        <button onClick={() => setEmailComposer({ isOpen: true, lead })} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-primary" title="Email">
                          <Mail size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => isExpanded ? setExpandedId(null) : setExpandedId(lead.place_id)}
                        className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-surface2/50 space-y-3">
                    {/* Contact details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {lead.phone && <div><span className="text-muted">Phone</span><p className="text-text font-medium">{lead.phone}</p></div>}
                      {lead.email && <div><span className="text-muted">Email</span><p className="text-text font-medium truncate">{lead.email}</p></div>}
                      {lead.website && (
                        <div>
                          <span className="text-muted">Website</span>
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1">
                            Visit <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                      {lead.address && <div className="col-span-2 sm:col-span-3"><span className="text-muted">Address</span><p className="text-text">{lead.address}</p></div>}
                    </div>

                    {/* Actions row */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Status */}
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-text"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => setFollowUpModal({ isOpen: true, lead })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:border-primary/50 flex items-center gap-1"
                      >
                        <Bell size={11} /> Reminder
                      </button>

                      <button
                        onClick={() => setNotesPanel({ isOpen: true, lead })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:border-primary/50 flex items-center gap-1"
                      >
                        <StickyNote size={11} /> Notes
                      </button>

                      {freelancerType && lead.website && !opp && (
                        <button
                          onClick={() => checkOpportunity(lead)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:border-primary/50 flex items-center gap-1"
                        >
                          <BarChart2 size={11} /> Score
                        </button>
                      )}

                      {opp && !opp.loading && (
                        <button
                          onClick={() => setOpportunityModal({ isOpen: true, lead })}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 flex items-center gap-1"
                        >
                          <Sparkles size={11} /> View Score
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Initial state */}
      {!isSearching && leads.length === 0 && !error && (
        <div className="text-center py-16 text-muted space-y-2">
          <Search size={32} className="mx-auto opacity-30" />
          <p>Enter a search above to find leads</p>
          <p className="text-xs">e.g. &quot;restaurants in Lekki&quot; or &quot;plumbers in Ikeja&quot;</p>
        </div>
      )}

      {/* Modals */}
      {whatsappComposer.lead && (
        <WhatsAppComposer
          lead={whatsappComposer.lead}
          isOpen={whatsappComposer.isOpen}
          onClose={() => setWhatsappComposer({ isOpen: false, lead: null })}
          onSent={() => { handleWhatsAppSent(whatsappComposer.lead!.place_id); setWhatsappComposer({ isOpen: false, lead: null }); }}
        />
      )}
      {emailComposer.lead && (
        <EmailComposer
          lead={emailComposer.lead}
          isOpen={emailComposer.isOpen}
          onClose={() => setEmailComposer({ isOpen: false, lead: null })}
          onSent={() => { handleEmailSent(emailComposer.lead!.place_id); setEmailComposer({ isOpen: false, lead: null }); }}
        />
      )}
      {followUpModal.lead && (
        <FollowUpModal
          lead={followUpModal.lead}
          isOpen={followUpModal.isOpen}
          onClose={() => setFollowUpModal({ isOpen: false, lead: null })}
          onSaved={() => { handleReminderSaved(followUpModal.lead!.place_id); setFollowUpModal({ isOpen: false, lead: null }); }}
        />
      )}
      {notesPanel.lead && (
        <NotesPanel
          lead={notesPanel.lead}
          isOpen={notesPanel.isOpen}
          onClose={() => setNotesPanel({ isOpen: false, lead: null })}
          onNoteSaved={handleNoteSaved}
          onNoteDeleted={handleNoteDeleted}
        />
      )}
      {opportunityModal.lead && (
        <OpportunityModal
          lead={opportunityModal.lead}
          scoreData={leadOpportunityScores[opportunityModal.lead.place_id] || null}
          freelancerType={freelancerType}
          isOpen={opportunityModal.isOpen}
          onClose={() => setOpportunityModal({ isOpen: false, lead: null })}
          onWhatsAppPitch={(lead) => {
            setOpportunityModal({ isOpen: false, lead: null });
            setWhatsappComposer({ isOpen: true, lead });
          }}
        />
      )}
    </div>
  );
}
