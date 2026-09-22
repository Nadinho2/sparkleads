'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  X,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, OutreachCampaign } from '@/types';

interface EnrollSequenceModalProps {
  isOpen: boolean;
  leads: Lead[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function EnrollSequenceModal({
  isOpen,
  leads,
  onClose,
  onSuccess,
}: EnrollSequenceModalProps) {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('new');
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [sendImmediately, setSendImmediately] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(false);

  const validLeads = leads.filter((l) => l.email && l.email.includes('@'));
  const missingEmailCount = leads.length - validLeads.length;

  useEffect(() => {
    if (!isOpen) return;

    // Suggest default campaign name
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const businessNiche = leads[0]?.type || 'Prospective';
    setNewCampaignName(`${businessNiche} Follow-up Sequence (${dateStr})`);

    // Fetch existing campaigns
    async function fetchCampaigns() {
      setLoadingCampaigns(true);
      try {
        const res = await fetch('/api/outreach/sequence');
        const data = await res.json();
        if (data.campaigns) {
          setCampaigns(data.campaigns.filter((c: OutreachCampaign) => c.status !== 'completed'));
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    }

    // Fetch agency clients if available
    fetch('/api/agency/clients')
      .then((r) => r.json())
      .then((data) => {
        if (data.clients && Array.isArray(data.clients)) {
          setClients(data.clients.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {});

    fetchCampaigns();
  }, [isOpen, leads]);

  if (!isOpen) return null;

  async function handleEnroll() {
    if (validLeads.length === 0) {
      toast.error('None of the selected leads have an email address.');
      return;
    }

    if (selectedCampaignId === 'new' && !newCampaignName.trim()) {
      toast.error('Please enter a campaign name.');
      return;
    }

    setIsLoading(true);

    try {
      const selectedClient = clients.find((c) => c.id === selectedClientId);
      const payload = {
        campaignId: selectedCampaignId !== 'new' ? selectedCampaignId : undefined,
        campaignName: selectedCampaignId === 'new' ? newCampaignName.trim() : undefined,
        clientId: selectedClientId || undefined,
        clientName: selectedClient?.name || undefined,
        recipients: validLeads.map((l) => ({
          email: l.email!,
          name: l.name,
          company: l.name,
          website: l.website || undefined,
          lead_id: l.id,
        })),
        sendFirstStepImmediately: sendImmediately,
      };

      const res = await fetch('/api/outreach/sequence/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enroll leads');
      }

      toast.success(
        `🚀 Successfully enrolled ${data.enrolledCount} leads! ${
          sendImmediately ? 'Step 1 is dispatching now.' : 'Scheduled in queue.'
        }`
      );
      onSuccess(data.enrolledCount);
      onClose();
    } catch (err: any) {
      console.error('[Enroll Error]:', err);
      toast.error(err.message || 'Failed to enroll in sequence');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0f1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Enroll in Follow-up Sequence</h3>
              <p className="text-xs text-white/50">
                Automate threaded follow-ups that halt when prospects reply
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Selected Stats Pill */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">{validLeads.length} leads ready</span>
              <span className="text-xs text-white/40">(valid email found)</span>
            </div>
            {missingEmailCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{missingEmailCount} skipped (no email)</span>
              </div>
            )}
          </div>

          {/* Campaign Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70 uppercase tracking-wider">
              Target Campaign
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              disabled={loadingCampaigns}
              className="w-full bg-[#181924] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="new">+ Create New Sequence Campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Name (if new) */}
          {selectedCampaignId === 'new' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/70 uppercase tracking-wider">
                Campaign Name
              </label>
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="e.g. Austin Marketing Agencies (Oct 2026)"
                className="w-full bg-[#181924] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-white/30"
              />
            </div>
          )}

          {/* Client Tagging (Optional) */}
          {clients.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/70 uppercase tracking-wider">
                Assign to Client (Optional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#181924] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">No Client (General Workspace Outreach)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3-Step Sequence Visual Preview */}
          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-white/70 uppercase tracking-wider">
              Sequence Steps Schedule
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">Step 1: Introduction & Offer</p>
                  <p className="text-[11px] text-white/50 truncate">
                    "Quick question about {'{company}'}" — Instant WhatsApp lead capture & speed pitch
                  </p>
                </div>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                  Day 0 (Immediate)
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-white/10 text-white/70 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">Step 2: Value-Add Threaded Follow-up</p>
                  <p className="text-[11px] text-white/50 truncate">
                    "Re: Quick question about {'{company}'}" — 2 conversion leak ideas
                  </p>
                </div>
                <span className="text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                  +3 Days
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-white/10 text-white/70 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">Step 3: Break-up & Closing File</p>
                  <p className="text-[11px] text-white/50 truncate">
                    "Re: Quick question about {'{company}'}" — Permission to close file
                  </p>
                </div>
                <span className="text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                  +4 Days
                </span>
              </div>
            </div>
          </div>

          {/* Immediate Dispatch Toggle */}
          <label className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-medium text-white">Send Step 1 Immediately</span>
                <p className="text-[11px] text-white/40">
                  Dispatches initial emails with anti-spam jitter delays
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-purple-500 bg-white/5"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEnroll}
            disabled={isLoading || validLeads.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Launching Sequence...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Launch Sequence ({validLeads.length} leads)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
