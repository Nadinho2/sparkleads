'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  AlertTriangle,
  Check,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  MailCheck,
  Users,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { Spinner } from '@/components/ui';
import { toast } from 'sonner';
import {
  OutreachCampaign,
  OutreachQueueItem,
  OutreachSequenceStats,
} from '@/types';

export default function OutreachPage() {
  const basePath = useBasePath();
  const router = useRouter();

  // Mode: 'sequences' (automated follow-ups) vs 'broadcast' (single send)
  const [activeTab, setActiveTab] = useState<'sequences' | 'broadcast'>('sequences');

  // Sender email verification
  const [hasSenderEmail, setHasSenderEmail] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick Broadcast state
  const [broadcastRecipients, setBroadcastRecipients] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<{ sent: number; failed: number } | null>(null);

  // Sequences state
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [queue, setQueue] = useState<OutreachQueueItem[]>([]);
  const [stats, setStats] = useState<OutreachSequenceStats>({
    totalLeads: 0,
    activeCount: 0,
    repliedCount: 0,
    completedCount: 0,
    step1Sent: 0,
    step2Sent: 0,
    step3Sent: 0,
  });
  const [loadingSequences, setLoadingSequences] = useState(false);
  const [runningWorker, setRunningWorker] = useState(false);
  const [workerResultBanner, setWorkerResultBanner] = useState<string | null>(null);

  // Sequence Builder Modal / Section
  const [showBuilder, setShowBuilder] = useState(false);
  const [campaignName, setCampaignName] = useState('Web Development & WhatsApp Automation Outreach');
  const [sequenceRecipients, setSequenceRecipients] = useState('');

  // 3-step sequence default templates
  const [step1Subject, setStep1Subject] = useState('Quick question regarding {company} website');
  const [step1Body, setStep1Body] = useState(
`Hi {name},

I came across {company} and was really impressed by the quality of work your team delivers.

While checking your online presence, I noticed a few quick opportunities where an updated, mobile-first design and an automated WhatsApp/client lead capture system could easily help you book more qualified appointments directly from your website.

We recently helped similar businesses increase their inbound inquiries by over 35% within 30 days.

Would you be open to a 5-minute chat or a free video walkthrough of what this would look like for {company}?

Best regards,
UltimaSpark Agency Team
https://www.ultimaspark.com/agency`
  );

  const [step2Delay, setStep2Delay] = useState(3);
  const [step2Subject, setStep2Subject] = useState('Re: Quick question regarding {company} website');
  const [step2Body, setStep2Body] = useState(
`Hi {firstName},

I wanted to quickly follow up on my previous note in case it got buried under your inbox.

Did you get a moment to review the idea for improving {company}'s website and lead booking flow?

Happy to share a quick 2-minute video mockup whenever you have a brief moment.

Best,
UltimaSpark Agency`
  );

  const [step3Delay, setStep3Delay] = useState(4);
  const [step3Subject, setStep3Subject] = useState('Re: Quick question regarding {company} website');
  const [step3Body, setStep3Body] = useState(
`Hi {firstName},

I know you're busy running {company}, so I won't keep following up.

If you ever decide to modernize your website or want an automated booking assistant to capture more leads around the clock, feel free to reach back out anytime.

Wishing you and the team continued success!

Best regards,
UltimaSpark Agency`
  );

  const [launchingSequence, setLaunchingSequence] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'sent' | 'replied' | 'completed'>('all');

  // Check user sender email
  const checkSenderEmail = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/email');
      const data = await res.json();
      setHasSenderEmail(data.hasPassword && !!data.senderEmail);
      setSenderEmail(data.senderEmail || '');
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sequences and queue
  const fetchSequences = useCallback(async () => {
    try {
      setLoadingSequences(true);
      const res = await fetch('/api/outreach/sequence');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setQueue(data.queue || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load sequences:', e);
    } finally {
      setLoadingSequences(false);
    }
  }, []);

  useEffect(() => {
    checkSenderEmail();
    fetchSequences();
  }, [checkSenderEmail, fetchSequences]);

  // Run Follow-ups & Check Replies manually
  const handleRunWorker = async () => {
    setRunningWorker(true);
    setWorkerResultBanner(null);
    try {
      const res = await fetch('/api/cron/process-followups', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.result) {
        const r = data.result;
        const msg = `Checked inbox: ${r.repliedDetected} reply(s) detected. Sent: ${r.sent} follow-up email(s).`;
        setWorkerResultBanner(msg);
        toast.success(msg);
        await fetchSequences();
      } else {
        toast.error(data.error || 'Failed to process follow-ups');
      }
    } catch {
      toast.error('Network error while running follow-ups');
    } finally {
      setRunningWorker(false);
    }
  };

  // Launch Sequence
  const handleLaunchSequence = async () => {
    const lines = sequenceRecipients
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error('Please enter at least one recipient email address');
      return;
    }

    const recipientList = lines.map((line) => {
      // Support comma-separated "email, name, company"
      const parts = line.split(',').map((p) => p.trim());
      return {
        email: parts[0],
        name: parts[1] || '',
        company: parts[2] || '',
      };
    });

    setLaunchingSequence(true);

    try {
      const res = await fetch('/api/outreach/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim(),
          sendFirstStepImmediately: true,
          steps: [
            {
              step_number: 1,
              delay_days: 0,
              subject: step1Subject.trim(),
              body: step1Body.trim(),
            },
            {
              step_number: 2,
              delay_days: Number(step2Delay) || 3,
              subject: step2Subject.trim(),
              body: step2Body.trim(),
            },
            {
              step_number: 3,
              delay_days: Number(step3Delay) || 4,
              subject: step3Subject.trim(),
              body: step3Body.trim(),
            },
          ],
          recipients: recipientList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to launch sequence');
        return;
      }

      toast.success(
        `Sequence launched! Step 1 dispatched to ${data.runResult?.sent || recipientList.length} recipient(s).`
      );
      setShowBuilder(false);
      setSequenceRecipients('');
      await fetchSequences();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create sequence');
    } finally {
      setLaunchingSequence(false);
    }
  };

  // Mark replied override
  const handleMarkReplied = async (queueId: string) => {
    try {
      const res = await fetch('/api/outreach/sequence/mark-replied', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId }),
      });
      if (res.ok) {
        toast.success('Marked as replied. Follow-ups stopped.');
        await fetchSequences();
      }
    } catch {
      toast.error('Failed to update lead');
    }
  };

  // Quick Broadcast Send handler (existing functionality)
  const handleBroadcastSend = async () => {
    const recipientList = broadcastRecipients
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));

    if (recipientList.length === 0 || !broadcastSubject.trim() || !broadcastBody.trim()) return;

    setBroadcastSending(true);
    setBroadcastResults(null);

    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientList,
          subject: broadcastSubject.trim(),
          body: broadcastBody.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'no_sender_email') {
          setHasSenderEmail(false);
          return;
        }
        toast.error(data.error || 'Failed to send emails');
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status === 'complete') {
              setBroadcastResults({ sent: data.sent, failed: data.failed });
              toast.success(`Broadcast finished: ${data.sent} sent, ${data.failed} failed`);
            }
          } catch {
            // Skip malformed
          }
        }
      }
    } catch (err) {
      console.error('Send failed:', err);
      toast.error('Outreach send encountered an error');
    } finally {
      setBroadcastSending(false);
    }
  };

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
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
      {/* Page Title & Account Connection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2.5">
            Email Outreach & Sequences
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/20">
              Auto-Follow-Up
            </span>
          </h1>
          <p className="text-sm text-muted mt-1">
            Multi-step cold outreach engine with threaded replies and automatic inbox reply detection
          </p>
        </div>

        {hasSenderEmail ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
            <Check className="w-3.5 h-3.5" />
            <span>Sending as: <strong>{senderEmail}</strong></span>
          </div>
        ) : (
          <button
            onClick={() => router.push(`${basePath}/settings`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning hover:bg-warning/20 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Connect sender email in Settings →</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('sequences')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
            activeTab === 'sequences'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Automated Follow-up Sequences
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
            activeTab === 'broadcast'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Send className="w-4 h-4" />
          Quick Broadcast (One-off)
        </button>
      </div>

      {/* SEQUENCES VIEW */}
      {activeTab === 'sequences' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between text-muted text-xs font-medium mb-1">
                <span>TOTAL LEADS</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-text">{stats.totalLeads}</p>
              <p className="text-xs text-muted mt-1">Enqueued in sequences</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between text-muted text-xs font-medium mb-1">
                <span>ACTIVE SEQUENCES</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-text">{stats.activeCount}</p>
              <p className="text-xs text-muted mt-1">Awaiting next step</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between text-muted text-xs font-medium mb-1">
                <span>REPLIED (STOPPED)</span>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <p className="text-2xl font-bold text-success">{stats.repliedCount}</p>
              <p className="text-xs text-muted mt-1">Follow-ups auto-halted</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between text-muted text-xs font-medium mb-1">
                <span>COMPLETED</span>
                <MailCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-text">{stats.completedCount}</p>
              <p className="text-xs text-muted mt-1">Finished all 3 steps</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBuilder(!showBuilder)}
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {showBuilder ? 'Close Builder' : 'New Sequence Campaign'}
              </button>

              <button
                onClick={handleRunWorker}
                disabled={runningWorker}
                className="px-4 py-2 rounded-lg border border-border bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${runningWorker ? 'animate-spin text-primary' : ''}`} />
                {runningWorker ? 'Checking Inbox & Sending...' : 'Run Follow-ups & Check Replies'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span>Filter:</span>
              {(['all', 'scheduled', 'sent', 'replied', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    filterStatus === s
                      ? 'bg-primary text-white font-medium'
                      : 'bg-surface2 hover:text-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Worker Result Banner */}
          {workerResultBanner && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-center justify-between gap-3 text-sm text-success">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{workerResultBanner}</span>
              </div>
              <button
                onClick={() => setWorkerResultBanner(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SEQUENCE BUILDER */}
          {showBuilder && (
            <div className="p-6 rounded-xl border border-primary/40 bg-surface shadow-lg space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-semibold text-lg text-text">Create Automated 3-Step Sequence</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Step 1 sends immediately. Step 2 & 3 send as threaded replies unless the prospect responds.
                  </p>
                </div>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="text-sm text-muted hover:text-text px-2 py-1"
                >
                  Cancel
                </button>
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Houston Roofing Web Dev Pitch"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-border bg-surface2/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-text">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                    Step 1: Initial Cold Pitch (Day 1 - Dispatched Immediately)
                  </div>
                  <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded border border-border">Immediate Send</span>
                </div>
                <input
                  type="text"
                  value={step1Subject}
                  onChange={(e) => setStep1Subject(e.target.value)}
                  placeholder="Subject: e.g. Quick question regarding {company} website"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
                />
                <textarea
                  value={step1Body}
                  onChange={(e) => setStep1Body(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm font-mono resize-y"
                />
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-border bg-surface2/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-text">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Step 2: Gentle Threaded Bump
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <span>Wait:</span>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={step2Delay}
                      onChange={(e) => setStep2Delay(Number(e.target.value))}
                      className="w-12 px-1.5 py-0.5 text-center rounded border border-border bg-surface text-text text-xs"
                    />
                    <span>days after Step 1</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={step2Subject}
                  onChange={(e) => setStep2Subject(e.target.value)}
                  placeholder="Subject: e.g. Re: Quick question regarding {company} website"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
                />
                <textarea
                  value={step2Body}
                  onChange={(e) => setStep2Body(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm font-mono resize-y"
                />
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-border bg-surface2/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-text">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                    Step 3: Final Breakup / Value Drop
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <span>Wait:</span>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={step3Delay}
                      onChange={(e) => setStep3Delay(Number(e.target.value))}
                      className="w-12 px-1.5 py-0.5 text-center rounded border border-border bg-surface text-text text-xs"
                    />
                    <span>days after Step 2</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={step3Subject}
                  onChange={(e) => setStep3Subject(e.target.value)}
                  placeholder="Subject: e.g. Re: Quick question regarding {company} website"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm"
                />
                <textarea
                  value={step3Body}
                  onChange={(e) => setStep3Body(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm font-mono resize-y"
                />
              </div>

              {/* Recipients Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-text">
                    Recipients (One per line: email, name, company)
                  </label>
                  <span className="text-xs text-muted">
                    Available tags: <code className="text-primary font-mono">{'{name}'}</code>, <code className="text-primary font-mono">{'{firstName}'}</code>, <code className="text-primary font-mono">{'{company}'}</code>
                  </span>
                </div>
                <textarea
                  value={sequenceRecipients}
                  onChange={(e) => setSequenceRecipients(e.target.value)}
                  placeholder={`contact@houstonroofing.com, John Doe, Houston Roofing Pro\ninfo@apexrestorations.com, Jane Smith, Apex Restorations`}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                />
              </div>

              {/* Launch Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchSequence}
                  disabled={launchingSequence || !hasSenderEmail || !sequenceRecipients.trim()}
                  className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-sm"
                >
                  {launchingSequence ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Launching Sequence & Sending Step 1...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Launch Sequence Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Queue & Follow-up Pipeline Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Follow-up Pipeline Queue ({filteredQueue.length})
              </h3>
              <span className="text-xs text-muted">
                Replies are detected via IMAP and halt upcoming steps automatically
              </span>
            </div>

            {loadingSequences ? (
              <div className="p-8 text-center">
                <Spinner className="w-6 h-6 text-primary mx-auto" />
                <p className="text-xs text-muted mt-2">Loading outreach queue...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-text">No queue records found</p>
                <p className="text-xs text-muted mt-1">
                  Click "New Sequence Campaign" above to launch an automated follow-up sequence.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface2/50 text-muted uppercase font-medium border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Current Step</th>
                      <th className="py-3 px-4">Status & Sentiment</th>
                      <th className="py-3 px-4">Engagement</th>
                      <th className="py-3 px-4">Last Sent</th>
                      <th className="py-3 px-4">Next Scheduled Follow-up</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredQueue.map((item) => {
                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                          Scheduled
                        </span>
                      );

                      if (item.status === 'replied') {
                        if (item.reply_sentiment === 'interested') {
                          statusBadge = (
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1 w-max">
                                🔥 Hot Lead (Interested)
                              </span>
                              {item.reply_summary && (
                                <p className="text-[10px] text-emerald-300/80 max-w-[220px] truncate" title={item.reply_summary}>
                                  "{item.reply_summary}"
                                </p>
                              )}
                            </div>
                          );
                        } else if (item.reply_sentiment === 'out_of_office') {
                          statusBadge = (
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 flex items-center gap-1 w-max">
                                💤 Out of Office
                              </span>
                              {item.reply_summary && (
                                <p className="text-[10px] text-amber-200/70 max-w-[220px] truncate" title={item.reply_summary}>
                                  {item.reply_summary}
                                </p>
                              )}
                            </div>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold flex items-center gap-1 w-max">
                              <Check className="w-3 h-3" /> Replied (Stopped)
                            </span>
                          );
                        }
                      } else if (item.status === 'completed') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium">
                            Completed (3/3)
                          </span>
                        );
                      } else if (item.status === 'failed') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-medium">
                            Failed
                          </span>
                        );
                      } else if (item.status === 'sent') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                            Sent (Pending Delay)
                          </span>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-surface2/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-text">{item.recipient_email}</div>
                            {(item.recipient_name || item.company_name) && (
                              <div className="text-muted text-[11px]">
                                {[item.recipient_name, item.company_name].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-text">Step {item.current_step}</span>
                            <span className="text-muted"> of 3</span>
                          </td>
                          <td className="py-3 px-4">{statusBadge}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {typeof item.open_count === 'number' && item.open_count > 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-mono text-[11px] border border-cyan-500/20" title={`Opened ${item.open_count} time${item.open_count > 1 ? 's' : ''}`}>
                                  👁️ {item.open_count} open{item.open_count > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-muted/40 text-[11px]">—</span>
                              )}
                              {item.clicked_at && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium text-[10px]">
                                  Clicked
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {item.last_sent_at
                              ? new Date(item.last_sent_at).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {item.status === 'replied' || item.status === 'completed' ? (
                              <span className="text-muted opacity-60">Finished</span>
                            ) : item.next_run_at ? (
                              new Date(item.next_run_at).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.status !== 'replied' && item.status !== 'completed' && (
                              <button
                                onClick={() => handleMarkReplied(item.id)}
                                className="px-2.5 py-1 rounded bg-surface2 hover:bg-surface2/80 text-muted hover:text-text border border-border text-[11px] transition-colors"
                                title="Mark as replied to cancel remaining follow-ups"
                              >
                                Mark Replied
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK BROADCAST VIEW (EXISTING PRESERVED) */}
      {activeTab === 'broadcast' && (
        <div className="p-6 rounded-xl border border-border bg-surface space-y-5">
          <div>
            <h3 className="font-semibold text-text text-base">Quick Broadcast Email</h3>
            <p className="text-xs text-muted mt-0.5">
              Send a single one-off email to multiple leads simultaneously
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Recipients (one email per line)
            </label>
            <textarea
              value={broadcastRecipients}
              onChange={(e) => setBroadcastRecipients(e.target.value)}
              placeholder={'email1@example.com\nemail2@example.com\nemail3@example.com'}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Subject</label>
            <input
              type="text"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="e.g. Quick question about your business"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Message Body</label>
            <textarea
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Write your outreach message here..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
            />
          </div>

          <button
            onClick={handleBroadcastSend}
            disabled={
              broadcastSending ||
              !hasSenderEmail ||
              !broadcastRecipients.trim() ||
              !broadcastSubject.trim() ||
              !broadcastBody.trim()
            }
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {broadcastSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Broadcast
              </>
            )}
          </button>

          {broadcastResults && (
            <div className="p-4 rounded-xl border border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-success" />
                <h4 className="font-semibold text-text text-sm">Broadcast Complete</h4>
              </div>
              <p className="text-xs text-muted">
                {broadcastResults.sent} sent successfully
                {broadcastResults.failed > 0 && `, ${broadcastResults.failed} failed`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
