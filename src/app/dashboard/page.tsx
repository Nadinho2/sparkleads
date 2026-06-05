'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  Trash2,
  MessageCircle,
  Mail,
  Copy,
  ExternalLink,
  Zap,
  Lightbulb,
  Check,
  X,
  Bell,
  StickyNote,
  Plus,
  Sparkles,
  BarChart2,
  MapPin,
  Users,
  Loader2,
  Wand2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSearchStream } from '@/hooks/useSearchStream';
import { Spinner } from '@/components/ui';
import { WhatsAppComposer } from '@/components/dashboard/WhatsAppComposer';
import { EmailComposer } from '@/components/dashboard/EmailComposer';
import { BulkWhatsAppComposer } from '@/components/dashboard/BulkWhatsAppComposer';
import { BulkEmailComposer } from '@/components/dashboard/BulkEmailComposer';
import { FollowUpModal } from '@/components/dashboard/FollowUpModal';
import { NotesPanel } from '@/components/dashboard/NotesPanel';
import type { Lead } from '@/types';

interface DueReminder {
  id: string;
  lead_id: string;
  due_date: string;
  note: string | null;
  status: string;
  lead: Lead | null;
}

type LeadStatus = Lead['status'];

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'closed', label: 'Closed' },
  { value: 'not_interested', label: 'Not Interested' },
];

function generateSuggestions(query: string): string[] {
  const parts = query.trim().split(/\s+in\s+/i);
  if (parts.length < 2) return [];

  const businessType = parts[0].trim();
  const locationPart = parts[1].trim();
  const locationWords = locationPart.split(/[,\s]+/).filter(Boolean);
  const city = locationWords[0] || '';

  if (!city) return [];

  const cityLower = city.toLowerCase();

  const lagosAreas: Record<string, string[]> = {
    lagos: ['Lekki', 'Victoria Island', 'Ikeja', 'Ikoyi'],
    abuja: ['Wuse', 'Garki', 'Maitama', 'Jabi'],
    london: ['Shoreditch', 'Camden', 'Soho', 'Brixton'],
    nairobi: ['Westlands', 'Kilimani', 'CBD', 'Karen'],
    dubai: ['Downtown', 'Marina', 'JBR', 'Business Bay'],
    accra: ['Osu', 'Labone', 'Cantonments', 'Airport City'],
  };

  const areas = lagosAreas[cityLower];
  if (areas) {
    return areas.map((area) => `${businessType} in ${area}`);
  }

  return [
    `${businessType} in ${city} CBD`,
    `${businessType} in ${city} Downtown`,
    `${businessType} in ${city} Main Area`,
    `${businessType} near ${city}`,
  ];
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [query, setQuery] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());
  const [whatsappComposer, setWhatsappComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [emailComposer, setEmailComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkWhatsApp, setBulkWhatsApp] = useState(false);
  const [bulkEmail, setBulkEmail] = useState(false);
  const [followUpModal, setFollowUpModal] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [showReminders, setShowReminders] = useState(true);
  const lastCheckedCountRef = useRef(0);
  const [notesPanel, setNotesPanel] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [filterHasNotes, setFilterHasNotes] = useState(false);

  // AI Write modal
  const [aiModal, setAiModal] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [aiServiceDesc, setAiServiceDesc] = useState('');
  const [aiTone, setAiTone] = useState('friendly');
  const [aiMsgType, setAiMsgType] = useState('whatsapp');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    whatsappMessage: string;
    emailSubject: string;
    emailBody: string;
    personalizationHook: string;
  } | null>(null);
  const [aiTemplates, setAiTemplates] = useState<{ id: string; name: string; service_description: string; tone: string; message_type: string }[]>([]);

  // Website grade tracking
  const [leadGrades, setLeadGrades] = useState<Record<string, { score: number; gradeId: string; loading: boolean }>>({});
  const [showGradeNudge, setShowGradeNudge] = useState(false);
  const [gradingAll, setGradingAll] = useState(false);
  const [gradeNudgeDismissed, setGradeNudgeDismissed] = useState(false);

  // Pipeline progress tracking
  const [leadPipeline, setLeadPipeline] = useState<Record<string, {
    graded?: boolean;
    audited?: boolean;
    proposed?: boolean;
    contacted?: boolean;
  }>>({});

  const { leads, isSearching, error, search, reset, updateLead } = useSearchStream({
    sessionId,
    isPaid: true,
  });

  useEffect(() => {
    fetch('/api/reminders/list?status=pending&date=today')
      .then((r) => r.json())
      .then((data) => setDueReminders(data.reminders || []))
      .catch(() => {});
  }, []);

  const markReminderDone = async (reminderId: string) => {
    await fetch('/api/reminders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reminderId, status: 'done' }),
    });
    setDueReminders((prev) => prev.filter((r) => r.id !== reminderId));
    toast.success('Follow-up marked as done');
  };

  const handleReminderSaved = (placeId: string) => {
    updateLead(placeId, { hasReminder: true });
  };

  const openNotesPanel = (lead: Lead) => {
    setNotesPanel({ isOpen: true, lead });
  };

  const handleNoteSaved = (leadId: string, content: string) => {
    updateLead(leads.find((l) => l.id === leadId)?.place_id || '', { note: content });
    setNotesPanel((prev) => ({
      ...prev,
      lead: prev.lead?.id === leadId ? { ...prev.lead, note: content } : prev.lead,
    }));
  };

  const handleNoteDeleted = (leadId: string) => {
    updateLead(leads.find((l) => l.id === leadId)?.place_id || '', { note: null });
    setNotesPanel((prev) => ({
      ...prev,
      lead: prev.lead?.id === leadId ? { ...prev.lead, note: null } : prev.lead,
    }));
  };

  const loadNotesForResults = useCallback(async (leadsToLoad: Lead[]) => {
    if (leadsToLoad.length === 0) return;
    try {
      const res = await fetch('/api/notes/bulk-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: leadsToLoad.map((l) => l.id) }),
      });
      const { notes } = await res.json();
      if (notes) {
        leadsToLoad.forEach((lead) => {
          const noteContent = notes[lead.id];
          if (noteContent !== undefined) {
            updateLead(lead.place_id, { note: noteContent });
          }
        });
      }
    } catch {
      // Silent fail
    }
  }, [updateLead]);

  useEffect(() => {
    let id = localStorage.getItem('sparkleads_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('sparkleads_session_id', id);
    }
    setSessionId(id);
  }, []);

  // Quick grade website inline
  const quickGradeWebsite = useCallback(async (lead: Lead) => {
    if (!lead.website || leadGrades[lead.place_id]?.score) return;

    setLeadGrades((prev) => ({
      ...prev,
      [lead.place_id]: { score: 0, gradeId: '', loading: true },
    }));

    try {
      const res = await fetch('/api/audit/grade-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lead.website, businessName: lead.name, leadId: lead.id }),
      });
      const data = await res.json();

      if (data.success) {
        setLeadGrades((prev) => ({
          ...prev,
          [lead.place_id]: { score: data.overallScore, gradeId: data.gradeId, loading: false },
        }));
        setLeadPipeline((prev) => ({
          ...prev,
          [lead.place_id]: { ...prev[lead.place_id], graded: true },
        }));
      } else {
        setLeadGrades((prev) => {
          const next = { ...prev };
          delete next[lead.place_id];
          return next;
        });
        toast.error(data.error || 'Failed to grade');
      }
    } catch {
      setLeadGrades((prev) => {
        const next = { ...prev };
        delete next[lead.place_id];
        return next;
      });
    }
  }, [leadGrades]);

  // Grade all websites with leads
  const gradeAllWithWebsites = useCallback(async () => {
    const ungraded = leads.filter((l) => l.website && !leadGrades[l.place_id]?.score);
    if (ungraded.length === 0) return;
    setGradingAll(true);
    for (const lead of ungraded.slice(0, 5)) {
      await quickGradeWebsite(lead);
    }
    setGradingAll(false);
  }, [leads, leadGrades, quickGradeWebsite]);

  // Grade nudge effect — show after 10s if many ungraded websites
  useEffect(() => {
    if (!leads.length || gradeNudgeDismissed) return;
    const ungradedWithWebsite = leads.filter((r) => r.website && !leadGrades[r.place_id]);
    if (ungradedWithWebsite.length >= 3) {
      const timer = setTimeout(() => setShowGradeNudge(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [leads, leadGrades, gradeNudgeDismissed]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;
    setCurrentQuery(query);
    setSuggestions([]);
    await search(query);
  }, [query, isSearching, search]);

  useEffect(() => {
    if (!isSearching && leads.length > 0 && currentQuery) {
      setSuggestions(generateSuggestions(currentQuery));
    }
  }, [isSearching, leads.length, currentQuery]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setCurrentQuery(suggestion);
      setSuggestions([]);
      search(suggestion);
    },
    [search]
  );

  const handleClear = useCallback(() => {
    reset();
    setQuery('');
    setCurrentQuery('');
    setSuggestions([]);
  }, [reset]);

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status }),
      });
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

  const handleCopyEmail = useCallback(async (email: string, leadId: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmailId(leadId);
      setTimeout(() => setCopiedEmailId(null), 2000);
    } catch {
      // Silent fail
    }
  }, []);

  const manualScrapeEmail = useCallback(async (lead: Lead) => {
    setScanningIds((prev) => new Set(prev).add(lead.place_id));
    try {
      const res = await fetch('/api/scrape-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lead.website }),
      });
      const { email } = await res.json();
      if (email) {
        updateLead(lead.place_id, { email });
      }
    } catch {
      // Silent fail
    } finally {
      setScanningIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.place_id);
        return next;
      });
    }
  }, [updateLead]);

  const handleWhatsAppSent = useCallback((placeId: string) => {
    updateLead(placeId, { status: 'contacted' });
  }, [updateLead]);

  const handleEmailSent = useCallback((placeId: string) => {
    updateLead(placeId, { status: 'contacted' });
  }, [updateLead]);

  const toggleLead = useCallback((placeId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedLeads(new Set());
      setSelectAll(false);
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.place_id)));
      setSelectAll(true);
    }
  }, [selectAll, leads]);

  useEffect(() => {
    setSelectedLeads(new Set());
    setSelectAll(false);
    lastCheckedCountRef.current = 0;
  }, [leads.length]);

  useEffect(() => {
    if (!isSearching && leads.length > 0 && lastCheckedCountRef.current !== leads.length) {
      lastCheckedCountRef.current = leads.length;
      const leadIds = leads.map((l) => l.id);
      fetch('/api/reminders/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: leadIds }),
      })
        .then((r) => r.json())
        .then((data) => {
          const ids: string[] = data.lead_ids_with_reminders || [];
          ids.forEach((id) => {
            const lead = leads.find((l) => l.id === id);
            if (lead) {
              updateLead(lead.place_id, { hasReminder: true });
            }
          });
        })
        .catch(() => {});
      loadNotesForResults(leads);
    }
  }, [isSearching, leads, updateLead, loadNotesForResults]);

  const selectedLeadObjects = leads.filter((l) => selectedLeads.has(l.place_id));

  const handleExportCsv = useCallback(async () => {
    if (leads.length === 0) return;

    try {
      const response = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, query: currentQuery }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sparkleads-${currentQuery.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail
    }
  }, [leads, currentQuery]);

  // AI Write modal functions
  const openAIModal = useCallback(async (lead: Lead) => {
    setAiModal({ isOpen: true, lead });
    setAiResult(null);
    setAiGenerating(false);
    // Load templates
    try {
      const res = await fetch('/api/messages/templates');
      const data = await res.json();
      if (data.templates) setAiTemplates(data.templates);
    } catch { /* ignore */ }
  }, []);

  const handleAIGenerate = useCallback(async () => {
    if (!aiModal.lead) return;
    if (!aiServiceDesc.trim()) { toast.error('Describe your service'); return; }

    setAiGenerating(true);
    setAiResult(null);

    try {
      const lead = aiModal.lead;
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [{
            id: lead.id,
            name: lead.name,
            type: lead.type,
            address: lead.address,
            rating: lead.rating,
            website: lead.website,
            email: lead.email,
            phone: lead.phone,
          }],
          serviceDescription: aiServiceDesc.trim(),
          tone: aiTone,
          messageType: aiMsgType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to generate');
        }
        return;
      }

      if (data.messages?.length > 0) {
        setAiResult(data.messages[0]);
        toast.success(`Message generated! (${data.creditsUsed} credits)`);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setAiGenerating(false);
    }
  }, [aiModal.lead, aiServiceDesc, aiTone, aiMsgType]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }

  return (
    <div className="space-y-6">
      {/* Due Today Banner */}
      {dueReminders.length > 0 && showReminders && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-yellow-400" />
              <span className="font-semibold text-yellow-400">
                {dueReminders.length} follow-up{dueReminders.length > 1 ? 's' : ''} due today
              </span>
            </div>
            <button
              onClick={() => setShowReminders(false)}
              className="text-muted hover:text-text"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {dueReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between bg-surface rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium text-text text-sm">
                    {reminder.lead?.name}
                  </p>
                  {reminder.note && (
                    <p className="text-xs text-muted mt-0.5">{reminder.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {reminder.lead?.phone && (
                    <button
                      onClick={() => setWhatsappComposer({ isOpen: true, lead: reminder.lead as Lead })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium"
                    >
                      WhatsApp
                    </button>
                  )}
                  <button
                    onClick={() => markReminderDone(reminder.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-surface2 hover:bg-surface text-muted hover:text-text"
                  >
                    Mark done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. restaurants in Lagos Nigeria"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isSearching}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-6 py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <Spinner size="sm" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </div>

      {/* Results Header */}
      {leads.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">
              Found {leads.length} businesses
            </span>
            {isSearching && <Spinner size="sm" className="text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterHasNotes(!filterHasNotes)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filterHasNotes
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-surface text-muted hover:text-text'
              }`}
            >
              <StickyNote size={14} />
              Has notes
              {filterHasNotes && <X size={12} />}
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm text-muted hover:text-text hover:border-primary/50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm text-muted hover:text-danger hover:border-danger/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && !isSearching && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Lightbulb className="w-4 h-4" />
            Try:
          </span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 rounded-full border border-border bg-surface2 text-sm text-muted hover:text-text hover:border-primary/50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {leads.length === 0 && !isSearching && !currentQuery && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Start finding leads
          </h2>
          <p className="text-muted mb-6">
            Search for any business type in any city to get started
          </p>
          <p className="text-sm text-muted">
            Try:{' '}
            <button
              onClick={() => {
                setQuery('salons in Lagos Nigeria');
                search('salons in Lagos Nigeria');
                setCurrentQuery('salons in Lagos Nigeria');
              }}
              className="text-primary hover:underline"
            >
              salons in Lagos Nigeria
            </button>
          </p>
        </div>
      )}

      {/* Loading State */}
      {isSearching && leads.length === 0 && (
        <div className="text-center py-16">
          <Spinner size="lg" className="mx-auto mb-4 text-primary" />
          <p className="text-muted">Searching for businesses...</p>
        </div>
      )}

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-border bg-surface accent-primary cursor-pointer"
                    />
                  </th>
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
                    Reviews
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
                {leads.filter((l) => !filterHasNotes || l.note).map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-surface2/50 transition-colors animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.place_id)}
                        onChange={() => toggleLead(lead.place_id)}
                        className="w-4 h-4 rounded border-border bg-surface accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">{i + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-text">
                      {lead.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {lead.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.email ? (
                        <div className="flex items-center gap-2">
                          <span className="text-text">{lead.email}</span>
                          <button
                            onClick={() => handleCopyEmail(lead.email!, lead.id)}
                            className="text-muted hover:text-primary"
                            title="Copy email"
                          >
                            {copiedEmailId === lead.id ? (
                              <Check size={14} className="text-success" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      ) : scanningIds.has(lead.place_id) ? (
                        <div className="flex items-center gap-2 text-muted">
                          <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <span className="text-xs">Scanning...</span>
                        </div>
                      ) : lead.website ? (
                        <button
                          onClick={() => manualScrapeEmail(lead)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Search size={12} />
                          Find email
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate max-w-[120px]"
                          >
                            {lead.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}
                          </a>
                        ) : (
                          <span className="text-xs text-muted">No website</span>
                        )}
                        {lead.website && (
                          <>
                            {leadGrades[lead.place_id]?.loading ? (
                              <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : leadGrades[lead.place_id]?.score ? (
                              <button
                                onClick={() => router.push(`/dashboard/audit/grade?id=${leadGrades[lead.place_id].gradeId}`)}
                                className={`text-xs px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all hover:scale-105 ${
                                  leadGrades[lead.place_id].score >= 70
                                    ? 'bg-green-500/20 text-green-400'
                                    : leadGrades[lead.place_id].score >= 50
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {leadGrades[lead.place_id].score}/100
                              </button>
                            ) : (
                              <button
                                onClick={() => quickGradeWebsite(lead)}
                                className="text-xs px-2 py-0.5 rounded-full bg-surface2 text-muted hover:text-primary hover:bg-surface transition-colors border border-border"
                              >
                                Grade
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Pipeline progress dots */}
                      <div className="flex items-center gap-1 mt-1">
                        {[
                          { key: 'graded', icon: '\ud83d\udcca', label: 'Graded' },
                          { key: 'audited', icon: '\ud83d\udccb', label: 'Audited' },
                          { key: 'proposed', icon: '\ud83d\udcc4', label: 'Proposed' },
                          { key: 'contacted', icon: '\u2713', label: 'Contacted' },
                        ].map((step) => (
                          <div
                            key={step.key}
                            title={step.label}
                            className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                              leadPipeline[lead.place_id]?.[step.key as keyof typeof leadPipeline[string]]
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-surface2 text-muted opacity-40'
                            }`}
                          >
                            {step.icon}
                          </div>
                        ))}
                      </div>
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
                          onClick={() => openNotesPanel(lead)}
                          className="group flex items-start gap-2 text-left w-full max-w-[200px]"
                        >
                          <StickyNote size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-muted group-hover:text-text transition-colors truncate">
                            {lead.note}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openNotesPanel(lead)}
                          className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                        >
                          <Plus size={12} />
                          Add note
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {lead.phone && (
                          <button
                            onClick={() => setWhatsappComposer({ isOpen: true, lead })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors"
                            title="Send WhatsApp"
                          >
                            <MessageCircle size={12} />
                            <span className="hidden xl:inline">WhatsApp</span>
                          </button>
                        )}
                        {lead.email && (
                          <button
                            onClick={() => setEmailComposer({ isOpen: true, lead })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                            title="Send email"
                          >
                            <Mail size={12} />
                            <span className="hidden xl:inline">Email</span>
                          </button>
                        )}
                        <button
                          onClick={() => setFollowUpModal({ isOpen: true, lead })}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            lead.hasReminder
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-surface2 text-muted hover:text-text hover:bg-surface'
                          }`}
                          title={lead.hasReminder ? 'Reminder set' : 'Set follow-up reminder'}
                        >
                          <Bell size={12} />
                          <span className="hidden xl:inline">{lead.hasReminder ? 'Reminder set' : 'Remind me'}</span>
                        </button>
                        {lead.phone && (
                          <button
                            onClick={() => handleCopyPhone(lead.phone!, lead.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Copy phone"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
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
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            localStorage.setItem('sparkleads_content_lead', JSON.stringify(lead));
                            router.push('/dashboard/content');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                          title="Generate social media content"
                        >
                          <Sparkles size={12} />
                          <span className="hidden xl:inline">Content</span>
                        </button>
                        {lead.website && (
                          <button
                            onClick={() => {
                              localStorage.setItem('sparkleads_grade_url', JSON.stringify({
                                url: lead.website,
                                businessName: lead.name,
                                leadId: lead.id,
                                location: lead.address,
                                phone: lead.phone,
                              }));
                              router.push('/dashboard/audit/grade');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors"
                            title="Grade website"
                          >
                            <BarChart2 size={12} />
                            <span className="hidden xl:inline">Grade</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            localStorage.setItem('sparkleads_gbp_check', JSON.stringify({
                              businessName: lead.name,
                              location: lead.address,
                              leadId: lead.id,
                            }));
                            router.push('/dashboard/audit/gbp');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                          title="Check Google Business Profile"
                        >
                          <MapPin size={12} />
                          <span className="hidden xl:inline">Google</span>
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem('sparkleads_competitor_check', JSON.stringify({
                              businessName: lead.name,
                              businessType: lead.type,
                              location: lead.address,
                              leadId: lead.id,
                            }));
                            router.push('/dashboard/audit/competitors');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
                          title="Competitor analysis"
                        >
                          <Users size={12} />
                          <span className="hidden xl:inline">Compete</span>
                        </button>
                        <button
                          onClick={() => openAIModal(lead)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-medium transition-all"
                          title="AI message writer"
                        >
                          <Sparkles size={12} />
                          <span className="hidden xl:inline">AI Write</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && error !== 'free_limit_reached' && (
        <div className="text-center py-8">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {/* Composer Modals */}
      <WhatsAppComposer
        lead={whatsappComposer.lead}
        isOpen={whatsappComposer.isOpen}
        onClose={() => setWhatsappComposer({ isOpen: false, lead: null })}
        onSent={handleWhatsAppSent}
      />

      <EmailComposer
        lead={emailComposer.lead}
        isOpen={emailComposer.isOpen}
        onClose={() => setEmailComposer({ isOpen: false, lead: null })}
        onSent={handleEmailSent}
      />

      <FollowUpModal
        lead={followUpModal.lead}
        isOpen={followUpModal.isOpen}
        onClose={() => setFollowUpModal({ isOpen: false, lead: null })}
        onSaved={handleReminderSaved}
      />

      <NotesPanel
        lead={notesPanel.lead}
        isOpen={notesPanel.isOpen}
        onClose={() => setNotesPanel({ isOpen: false, lead: null })}
        onNoteSaved={handleNoteSaved}
        onNoteDeleted={handleNoteDeleted}
        onOpenFollowUp={(lead) => {
          setNotesPanel({ isOpen: false, lead: null });
          setFollowUpModal({ isOpen: true, lead });
        }}
        onMarkContacted={(leadId) => handleStatusChange(leadId, 'contacted')}
      />

      <BulkWhatsAppComposer
        leads={selectedLeadObjects}
        isOpen={bulkWhatsApp}
        onClose={() => setBulkWhatsApp(false)}
        onComplete={(count) => {
          setBulkWhatsApp(false);
          setSelectedLeads(new Set());
          setSelectAll(false);
          toast.success(`${count} WhatsApp messages queued`);
        }}
      />

      <BulkEmailComposer
        leads={selectedLeadObjects}
        isOpen={bulkEmail}
        onClose={() => setBulkEmail(false)}
        onComplete={(count) => {
          setBulkEmail(false);
          setSelectedLeads(new Set());
          setSelectAll(false);
          toast.success(`${count} emails sent`);
        }}
      />

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-surface border border-border shadow-2xl shadow-black/40 backdrop-blur-sm max-w-[calc(100vw-2rem)]"
          >
            <span className="text-sm font-semibold text-text">
              {selectedLeads.size} selected
            </span>

            <div className="w-px h-5 bg-border" />

            <button
              onClick={() => setBulkWhatsApp(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
            >
              <MessageCircle size={15} />
              WhatsApp All
            </button>

            <button
              onClick={() => setBulkEmail(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <Mail size={15} />
              Email All
            </button>

            <div className="text-xs text-muted">
              Uses <span className="text-yellow-400 font-semibold">{selectedLeads.size} credits</span>
            </div>

            <div className="w-px h-5 bg-border" />

            <button
              onClick={() => { setSelectedLeads(new Set()); setSelectAll(false); }}
              className="text-muted hover:text-text transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grade Nudge Popup */}
      {showGradeNudge && !gradeNudgeDismissed && (
        <div className="fixed bottom-24 right-6 z-40 max-w-xs rounded-xl bg-surface border border-primary/30 p-4 shadow-2xl shadow-black/40">
          <button
            onClick={() => { setShowGradeNudge(false); setGradeNudgeDismissed(true); }}
            className="absolute top-2 right-2 text-muted"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3">
            <div className="text-2xl">{'\ud83d\udcca'}</div>
            <div>
              <p className="font-semibold text-text text-sm">Grade their websites</p>
              <p className="text-xs text-muted mt-1">
                {leads.filter((r) => r.website && !leadGrades[r.place_id]).length} businesses with websites haven&apos;t been graded. Low scores = easy clients to close.
              </p>
              <button
                onClick={() => { setShowGradeNudge(false); gradeAllWithWebsites(); }}
                disabled={gradingAll}
                className="mt-2 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {gradingAll ? 'Grading...' : 'Grade top 5 now (10 credits)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Write Modal */}
      <AnimatePresence>
        {aiModal.isOpen && aiModal.lead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!aiGenerating) setAiModal({ isOpen: false, lead: null }); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text">AI Message for {aiModal.lead.name}</h3>
                    <p className="text-xs text-muted">{aiModal.lead.type} · {aiModal.lead.address}</p>
                  </div>
                </div>
                <button onClick={() => setAiModal({ isOpen: false, lead: null })} className="p-2 rounded-lg hover:bg-surface2 text-muted">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Business Info */}
                <div className="flex flex-wrap gap-2">
                  {aiModal.lead.rating && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                      {aiModal.lead.rating} ★
                    </span>
                  )}
                  {!aiModal.lead.website && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">No website</span>
                  )}
                  {aiModal.lead.email && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">Has email</span>
                  )}
                  {aiModal.lead.phone && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Has phone</span>
                  )}
                </div>

                {/* Templates */}
                {aiTemplates.length > 0 && (
                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Load from template</label>
                    <div className="flex flex-wrap gap-1.5">
                      {aiTemplates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setAiServiceDesc(t.service_description);
                            setAiTone(t.tone);
                            setAiMsgType(t.message_type);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface2 text-text text-xs border border-border hover:border-primary transition-colors"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Description */}
                <div>
                  <label className="text-xs text-muted mb-1.5 block">Your Service Description</label>
                  <textarea
                    value={aiServiceDesc}
                    onChange={(e) => setAiServiceDesc(e.target.value)}
                    placeholder="e.g. I build professional websites for local businesses in Lagos. Sites include WhatsApp button, Google Maps, contact form..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                {/* Tone + Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Tone</label>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { value: 'friendly', label: '😊 Friendly' },
                        { value: 'professional', label: '💼 Professional' },
                        { value: 'bold', label: '⚡ Bold' },
                        { value: 'conversational', label: '💬 Conversational' },
                      ].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setAiTone(t.value)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                            aiTone === t.value ? 'bg-primary text-white' : 'bg-surface2 text-text border border-border'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1.5 block">Message Type</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { value: 'whatsapp', label: '📱 WA' },
                        { value: 'email', label: '📧 Email' },
                        { value: 'both', label: '📱📧 Both' },
                      ].map((mt) => (
                        <button
                          key={mt.value}
                          onClick={() => setAiMsgType(mt.value)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                            aiMsgType === mt.value ? 'bg-primary text-white' : 'bg-surface2 text-text border border-border'
                          }`}
                        >
                          {mt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !aiServiceDesc.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Writing message...</>
                  ) : (
                    <><Wand2 className="w-5 h-5" /> Write Message — 2 Credits</>
                  )}
                </button>

                {/* Results */}
                {aiResult && (
                  <div className="space-y-3 pt-2">
                    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-[10px] text-primary font-medium mb-0.5">Personalized because:</p>
                      <p className="text-xs text-muted">{aiResult.personalizationHook}</p>
                    </div>

                    {(aiMsgType === 'whatsapp' || aiMsgType === 'both') && (
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                            <MessageCircle size={12} /> WhatsApp
                          </span>
                          <div className="flex gap-1.5">
                            <button onClick={() => copyText(aiResult.whatsappMessage)} className="text-[10px] text-muted hover:text-text flex items-center gap-1">
                              <Copy size={10} /> Copy
                            </button>
                            {aiModal.lead?.phone && (
                              <button
                                onClick={() => {
                                  const phone = aiModal.lead!.phone?.replace(/[^0-9+]/g, '') || '';
                                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(aiResult.whatsappMessage)}`, '_blank');
                                }}
                                className="text-[10px] text-green-400 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink size={10} /> Send
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-text whitespace-pre-line">{aiResult.whatsappMessage}</p>
                      </div>
                    )}

                    {(aiMsgType === 'email' || aiMsgType === 'both') && (
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-400 flex items-center gap-1">
                            <Mail size={12} /> Email
                          </span>
                          <div className="flex gap-1.5">
                            <button onClick={() => copyText(`Subject: ${aiResult.emailSubject}\n\n${aiResult.emailBody}`)} className="text-[10px] text-muted hover:text-text flex items-center gap-1">
                              <Copy size={10} /> Copy
                            </button>
                            {aiModal.lead?.email && (
                              <button
                                onClick={() => {
                                  window.open(`mailto:${aiModal.lead!.email}?subject=${encodeURIComponent(aiResult.emailSubject)}&body=${encodeURIComponent(aiResult.emailBody)}`);
                                }}
                                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink size={10} /> Send
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-text mb-1">Subject: {aiResult.emailSubject}</p>
                        <p className="text-xs text-muted whitespace-pre-line">{aiResult.emailBody}</p>
                      </div>
                    )}

                    <button
                      onClick={() => router.push('/dashboard/messages')}
                      className="w-full text-center text-xs text-primary hover:underline py-1"
                    >
                      View all messages →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
