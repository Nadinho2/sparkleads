'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Loader2, Copy, ExternalLink, Check, FileDown,
  MessageSquare, Mail, Wand2, Filter, History,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  rating: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
}

interface GeneratedMessage {
  leadId: string | null;
  leadName: string;
  leadType: string;
  leadAddress: string;
  leadRating: number | null;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  personalizationHook: string;
  edited?: boolean;
}

interface Template {
  id: string;
  name: string;
  service_description: string;
  tone: string;
  message_type: string;
  generated_count: number;
}

function calculateCreditCost(count: number) {
  if (count <= 1) return 2;
  if (count <= 20) return 5;
  return Math.ceil(count / 20) * 5;
}

export default function AIMessagesPage() {
  const basePath = useBasePath();
  const router = useRouter();

  // Service setup
  const [serviceDescription, setServiceDescription] = useState('');
  const [tone, setTone] = useState('friendly');
  const [messageType, setMessageType] = useState('whatsapp');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Lead selection
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLead, setManualLead] = useState({ name: '', type: '', address: '', phone: '', email: '', website: '' });

  // Generation
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editField, setEditField] = useState<'whatsapp' | 'emailSubject' | 'emailBody'>('whatsapp');

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/templates');
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch { /* ignore */ }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const sessionId = localStorage.getItem('sparkleads_session_id');
      if (!sessionId) return;
      const res = await fetch(`/api/search/history?session_id=${sessionId}&limit=200`);
      const data = await res.json();
      if (data.leads) {
        const unique = new Map<string, Lead>();
        for (const lead of data.leads) {
          if (lead.name && !unique.has(lead.id)) {
            unique.set(lead.id, lead);
          }
        }
        setLeads(Array.from(unique.values()));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadLeads();
  }, [loadTemplates, loadLeads]);

  function loadTemplate(tmpl: Template) {
    setServiceDescription(tmpl.service_description);
    setTone(tmpl.tone);
    setMessageType(tmpl.message_type);
    setSelectedTemplateId(tmpl.id);
  }

  function toggleLead(id: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const filtered = getFilteredLeads();
    setSelectedLeadIds(new Set(filtered.map((l) => l.id)));
  }

  function deselectAll() {
    setSelectedLeadIds(new Set());
  }

  function addManualLead() {
    if (!manualLead.name.trim()) { toast.error('Business name is required'); return; }
    const id = 'manual-' + crypto.randomUUID();
    const newLead: Lead = {
      id,
      name: manualLead.name.trim(),
      type: manualLead.type.trim() || null,
      address: manualLead.address.trim() || null,
      rating: null,
      website: manualLead.website.trim() || null,
      email: manualLead.email.trim() || null,
      phone: manualLead.phone.trim() || null,
    };
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadIds((prev) => new Set(prev).add(id));
    setManualLead({ name: '', type: '', address: '', phone: '', email: '', website: '' });
    setShowManualInput(false);
    toast.success('Lead added');
  }

  function getFilteredLeads() {
    switch (filter) {
      case 'no-website': return leads.filter((l) => !l.website);
      case 'low-rating': return leads.filter((l) => l.rating && l.rating < 4.0);
      case 'has-email': return leads.filter((l) => l.email);
      default: return leads;
    }
  }

  const selectedLeads = leads.filter((l) => selectedLeadIds.has(l.id));
  const creditCost = calculateCreditCost(selectedLeads.length);

  async function handleGenerate() {
    if (selectedLeads.length === 0) { toast.error('Select at least one lead'); return; }
    if (!serviceDescription.trim()) { toast.error('Describe your service'); return; }

    setGenerating(true);
    setMessages([]);

    try {
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: selectedLeads,
          serviceDescription: serviceDescription.trim(),
          tone,
          messageType,
          templateId: selectedTemplateId || undefined,
          saveAsTemplate,
          templateName: templateName.trim() || undefined,
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

      setMessages(data.messages);
      toast.success(`${data.messages.length} messages generated! (${data.creditsUsed} credits)`);
      if (saveAsTemplate) loadTemplates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }

  function openWhatsApp(phone: string, message: string) {
    const cleanPhone = phone?.replace(/[^0-9+]/g, '') || '';
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function openEmail(email: string, subject: string, body: string) {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  }

  function startEdit(index: number, field: 'whatsapp' | 'emailSubject' | 'emailBody') {
    setEditingIndex(index);
    setEditField(field);
    if (field === 'whatsapp') setEditText(messages[index].whatsappMessage);
    else if (field === 'emailSubject') setEditText(messages[index].emailSubject);
    else setEditText(messages[index].emailBody);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    setMessages((prev) => prev.map((msg, i) => {
      if (i !== editingIndex) return msg;
      const updated = { ...msg, edited: true };
      if (editField === 'whatsapp') updated.whatsappMessage = editText;
      else if (editField === 'emailSubject') updated.emailSubject = editText;
      else updated.emailBody = editText;
      return updated;
    }));
    setEditingIndex(null);
  }

  function exportCSV() {
    const header = 'Business Name,Phone,Email,WhatsApp Message,Email Subject,Email Body';
    const rows = messages.map((m) => {
      const lead = selectedLeads.find((l) => l.id === m.leadId);
      return [
        `"${m.leadName}"`,
        `"${lead?.phone || ''}"`,
        `"${lead?.email || ''}"`,
        `"${m.whatsappMessage.replace(/"/g, '""')}"`,
        `"${m.emailSubject.replace(/"/g, '""')}"`,
        `"${m.emailBody.replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredLeads = getFilteredLeads();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">AI Message Writer</h1>
          <p className="text-muted text-sm">Generate personalized outreach messages for your leads.</p>
        </div>
        <button
          onClick={() => router.push(`${basePath}/messages/history`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface2 text-text border border-border rounded-xl text-sm font-medium hover:bg-surface transition-colors"
        >
          <History size={16} />
          History
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Service Setup */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <Wand2 size={16} className="text-primary" /> Your Service
            </h3>

            {/* Templates */}
            {templates.length > 0 && (
              <div className="mb-4">
                <label className="text-xs text-muted mb-1.5 block">Saved Templates</label>
                <div className="space-y-1.5">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => loadTemplate(tmpl)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-colors ${
                        selectedTemplateId === tmpl.id
                          ? 'bg-primary/10 border border-primary text-primary'
                          : 'bg-surface2 text-text border border-transparent hover:border-border'
                      }`}
                    >
                      <span className="truncate">{tmpl.name}</span>
                      <span className="text-xs text-muted ml-2">{tmpl.tone}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Service Description</label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="e.g. I build professional websites for local businesses in Lagos. Sites include WhatsApp button, Google Maps, contact form. Delivered in 7 days from ₦150,000"
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted mb-1.5 block">Tone</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'friendly', label: '😊 Friendly' },
                    { value: 'professional', label: '💼 Professional' },
                    { value: 'bold', label: '⚡ Bold' },
                    { value: 'conversational', label: '💬 Conversational' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        tone === t.value
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-text border border-border hover:border-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted mb-1.5 block">Message Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { value: 'whatsapp', label: '📱 WhatsApp' },
                    { value: 'email', label: '📧 Email' },
                    { value: 'both', label: '📱📧 Both' },
                  ].map((mt) => (
                    <button
                      key={mt.value}
                      onClick={() => setMessageType(mt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        messageType === mt.value
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-text border border-border hover:border-primary'
                      }`}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-muted">Save as Template</label>
                <button
                  onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                  className={`w-10 h-5 rounded-full transition-colors ${saveAsTemplate ? 'bg-primary' : 'bg-surface2 border border-border'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${saveAsTemplate ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {saveAsTemplate && (
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE: Lead Selection */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Filter size={16} className="text-primary" /> Select Leads
              </h3>
              <span className="text-xs text-primary font-medium">{selectedLeadIds.size} selected</span>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto">
              {[
                { value: 'all', label: 'All' },
                { value: 'no-website', label: 'No Website' },
                { value: 'low-rating', label: 'Low Rating' },
                { value: 'has-email', label: 'Has Email' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === f.value ? 'bg-primary text-white' : 'bg-surface2 text-muted border border-border'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
              <button onClick={deselectAll} className="text-xs text-muted hover:underline">Deselect</button>
              <button onClick={() => setShowManualInput(!showManualInput)} className="text-xs text-primary hover:underline ml-auto">+ Add Lead Manually</button>
            </div>

            {/* Manual Lead Input */}
            {showManualInput && (
              <div className="mb-3 p-3 rounded-lg bg-surface2 border border-border space-y-2">
                <input
                  type="text"
                  value={manualLead.name}
                  onChange={(e) => setManualLead({ ...manualLead, name: e.target.value })}
                  placeholder="Business name *"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualLead.type}
                    onChange={(e) => setManualLead({ ...manualLead, type: e.target.value })}
                    placeholder="Type (e.g. Restaurant)"
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    value={manualLead.address}
                    onChange={(e) => setManualLead({ ...manualLead, address: e.target.value })}
                    placeholder="Location"
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={manualLead.phone}
                    onChange={(e) => setManualLead({ ...manualLead, phone: e.target.value })}
                    placeholder="Phone"
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    value={manualLead.email}
                    onChange={(e) => setManualLead({ ...manualLead, email: e.target.value })}
                    placeholder="Email"
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    value={manualLead.website}
                    onChange={(e) => setManualLead({ ...manualLead, website: e.target.value })}
                    placeholder="Website"
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button
                  onClick={addManualLead}
                  className="w-full py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Add Lead
                </button>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => toggleLead(lead.id)}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-colors ${
                    selectedLeadIds.has(lead.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-surface2 border border-transparent hover:border-border'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                    selectedLeadIds.has(lead.id) ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {selectedLeadIds.has(lead.id) && <Check size={10} className="text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text truncate">{lead.name}</p>
                    <p className="text-[10px] text-muted truncate">{lead.type} · {lead.address}</p>
                  </div>
                  {!lead.website && <span className="text-[10px] text-red-400">No site</span>}
                  {lead.rating && lead.rating < 4 && <span className="text-[10px] text-yellow-400">{lead.rating}⭐</span>}
                </button>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted mb-2">No leads from search history</p>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add a lead manually to get started
                  </button>
                </div>
              )}
            </div>

            {/* Credit cost + Generate */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted">Credit cost:</span>
                <span className="text-sm font-bold text-primary">{creditCost} credits</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || selectedLeads.length === 0 || !serviceDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Generate for {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} — {creditCost} credits</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="space-y-4">
          {generating && (
            <div className="p-8 rounded-2xl border border-border bg-surface text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-text font-medium">Writing personalized messages...</p>
              <p className="text-xs text-muted mt-1">Reading each business profile and finding personalization angles</p>
            </div>
          )}

          {!generating && messages.length === 0 && (
            <div className="p-12 rounded-2xl border border-dashed border-border bg-surface/50 text-center">
              <Sparkles className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text mb-1">No messages yet</p>
              <p className="text-xs text-muted">Select leads and describe your service to generate messages</p>
            </div>
          )}

          {messages.length > 0 && (
            <>
              {/* Bulk actions */}
              <div className="flex flex-wrap gap-2 no-print">
                <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface2 text-text text-xs border border-border hover:bg-surface">
                  <FileDown size={14} /> Export CSV
                </button>
              </div>

              {/* Message cards */}
              {messages.map((msg, i) => (
                <div key={i} className="p-5 rounded-2xl border border-border bg-surface space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text">{msg.leadName}</p>
                      <p className="text-xs text-muted">{msg.leadType} · {msg.leadAddress}</p>
                    </div>
                    {msg.edited && <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">✏️ Edited</span>}
                  </div>

                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[10px] text-primary font-medium mb-0.5">💡 Personalized because:</p>
                    <p className="text-xs text-muted">{msg.personalizationHook}</p>
                  </div>

                  {/* WhatsApp */}
                  {(messageType === 'whatsapp' || messageType === 'both') && (
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-green-400 flex items-center gap-1"><MessageSquare size={12} /> WhatsApp</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => copyText(msg.whatsappMessage)} className="text-[10px] text-muted hover:text-text flex items-center gap-1"><Copy size={10} /> Copy</button>
                          <button onClick={() => startEdit(i, 'whatsapp')} className="text-[10px] text-muted hover:text-text">Edit</button>
                        </div>
                      </div>
                      {editingIndex === i && editField === 'whatsapp' ? (
                        <div>
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface2 text-xs text-text resize-none" />
                          <button onClick={saveEdit} className="mt-1 px-3 py-1 rounded-lg bg-primary text-white text-xs">Save</button>
                        </div>
                      ) : (
                        <p className="text-xs text-text whitespace-pre-line">{msg.whatsappMessage}</p>
                      )}
                      <button
                        onClick={() => {
                          const lead = selectedLeads.find((l) => l.id === msg.leadId);
                          openWhatsApp(lead?.phone || '', msg.whatsappMessage);
                        }}
                        className="mt-2 flex items-center gap-1 text-xs text-green-400 hover:underline"
                      >
                        <ExternalLink size={10} /> Send WhatsApp
                      </button>
                    </div>
                  )}

                  {/* Email */}
                  {(messageType === 'email' || messageType === 'both') && (
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-400 flex items-center gap-1"><Mail size={12} /> Email</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => copyText(`Subject: ${msg.emailSubject}\n\n${msg.emailBody}`)} className="text-[10px] text-muted hover:text-text flex items-center gap-1"><Copy size={10} /> Copy</button>
                          <button onClick={() => startEdit(i, 'emailBody')} className="text-[10px] text-muted hover:text-text">Edit</button>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-text mb-1">Subject: {msg.emailSubject}</p>
                      {editingIndex === i && editField === 'emailBody' ? (
                        <div>
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface2 text-xs text-text resize-none" />
                          <button onClick={saveEdit} className="mt-1 px-3 py-1 rounded-lg bg-primary text-white text-xs">Save</button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted whitespace-pre-line">{msg.emailBody}</p>
                      )}
                      <button
                        onClick={() => {
                          const lead = selectedLeads.find((l) => l.id === msg.leadId);
                          openEmail(lead?.email || '', msg.emailSubject, msg.emailBody);
                        }}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:underline"
                      >
                        <ExternalLink size={10} /> Send Email
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
