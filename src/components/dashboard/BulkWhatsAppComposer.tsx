'use client';

import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, SkipForward, Pause, Play } from 'lucide-react';
import type { Lead } from '@/types';

interface BulkWhatsAppComposerProps {
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: (sentCount: number) => void;
}

type Screen = 'compose' | 'sending' | 'done';

const variables = [
  { key: '{name}', label: 'Name' },
  { key: '{city}', label: 'City' },
  { key: '{address}', label: 'Address' },
  { key: '{rating}', label: 'Rating' },
];

function extractCity(address: string | null): string {
  if (!address) return '';
  const parts = address.split(',').map((s) => s.trim());
  return parts.length >= 2 ? parts[1] : parts[0] || '';
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  if (digits.startsWith('234')) return digits;
  if (phone.startsWith('+')) return phone.slice(1);
  return digits;
}

function replaceVars(template: string, lead: Lead): string {
  return template
    .replace(/\{name\}/g, lead.name)
    .replace(/\{city\}/g, extractCity(lead.address))
    .replace(/\{address\}/g, lead.address || '')
    .replace(/\{rating\}/g, lead.rating ? String(lead.rating) : '');
}

export function BulkWhatsAppComposer({ leads, isOpen, onClose, onComplete }: BulkWhatsAppComposerProps) {
  const [screen, setScreen] = useState<Screen>('compose');
  const [message, setMessage] = useState('');
  const [recipientLeads, setRecipientLeads] = useState<Lead[]>(leads);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [balance, setBalance] = useState(0);
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setScreen('compose');
      setMessage('');
      setRecipientLeads(leads);
      setPreviewIdx(0);
      setSentCount(0);
      setFailedCount(0);
      setSkippedCount(0);
      setCurrentIdx(0);
      setPaused(false);
      pausedRef.current = false;
      fetch('/api/credits/ensure')
        .then((res) => res.json())
        .then((data) => setBalance(data.balance ?? 0))
        .catch(() => setBalance(0));
    }
  }, [isOpen, leads]);

  const insertVariable = (key: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMsg = message.slice(0, start) + key + message.slice(end);
    setMessage(newMsg);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + key.length, start + key.length);
    }, 0);
  };

  const removeRecipient = (placeId: string) => {
    setRecipientLeads((prev) => prev.filter((l) => l.place_id !== placeId));
  };

  const sendableLeads = recipientLeads.filter((l) => l.phone);
  const effectiveCount = Math.min(sendableLeads.length, balance);
  const notEnough = balance < sendableLeads.length;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startSending = async () => {
    setScreen('sending');
    setSending(true);
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < sendableLeads.length; i++) {
      if (balance - sent <= 0) break;

      const lead = sendableLeads[i];
      setCurrentIdx(i);

      for (let t = 4; t > 0; t--) {
        setCountdown(t);
        await sleep(1000);
        if (pausedRef.current) {
          while (pausedRef.current) {
            await sleep(200);
          }
        }
      }

      try {
        const personalized = replaceVars(message, lead);
        const formatted = formatPhone(lead.phone!);
        const encoded = encodeURIComponent(personalized);
        window.open(`https://wa.me/${formatted}?text=${encoded}`, '_blank');

        const res = await fetch('/api/outreach/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id, type: 'whatsapp', message: personalized }),
        });

        if (res.ok) {
          sent++;
          setSentCount(sent);
        } else {
          failed++;
          setFailedCount(failed);
        }
      } catch {
        failed++;
        setFailedCount(failed);
      }
    }

    setSending(false);
    setScreen('done');
    onComplete(sent);
  };

  const handlePause = () => {
    setPaused(!paused);
    pausedRef.current = !paused;
  };

  const handleSkip = () => {
    setSkippedCount((c) => c + 1);
    setCountdown(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={sending ? undefined : onClose} />
      <div className="relative z-50 w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {screen === 'compose' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-text">Send WhatsApp to {sendableLeads.length} businesses</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-border">
              <p className="text-xs text-muted mb-2">Recipients:</p>
              <div className="flex flex-wrap gap-2">
                {recipientLeads.slice(0, 5).map((l) => (
                  <span key={l.place_id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface2 text-xs text-text">
                    {l.name}
                    <button onClick={() => removeRecipient(l.place_id)} className="text-muted hover:text-danger">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {recipientLeads.length > 5 && (
                  <span className="px-3 py-1 rounded-full bg-surface2 text-xs text-muted">+{recipientLeads.length - 5} more</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={"Write your message...\nUse {name} for business name, {city} for their city"}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
                />
                <p className="text-xs text-muted mt-1 text-right">{message.length} / 1000</p>
              </div>

              <div>
                <p className="text-xs text-muted mb-2">Variables (click to insert):</p>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <button key={v.key} onClick={() => insertVariable(v.key)} className="px-3 py-1.5 rounded-lg bg-surface2 border border-border text-xs text-text hover:border-primary/50 transition-colors">
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              {message && sendableLeads.length > 0 && (
                <div className="p-4 rounded-lg bg-surface2 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted">Preview for:</p>
                    <select
                      value={previewIdx}
                      onChange={(e) => setPreviewIdx(Number(e.target.value))}
                      className="text-xs bg-transparent border border-border rounded px-2 py-1 text-text"
                    >
                      {sendableLeads.map((l, i) => (
                        <option key={l.place_id} value={i} className="bg-surface">{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-text whitespace-pre-wrap">{replaceVars(message, sendableLeads[previewIdx])}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border space-y-3">
              {notEnough && (
                <p className="text-xs text-warning">Not enough credits. You can send to {balance} businesses with your current balance.</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">
                  Uses <span className="text-yellow-400 font-semibold">{effectiveCount} credits</span> · Balance: {balance}
                </p>
                <button
                  onClick={startSending}
                  disabled={!message.trim() || sendableLeads.length === 0 || balance === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Sending Queue →
                </button>
              </div>
            </div>
          </>
        )}

        {screen === 'sending' && (
          <>
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text">Sending WhatsApp messages...</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text">{sentCount} of {sendableLeads.length} sent</span>
                  {skippedCount > 0 && <span className="text-xs text-muted">{skippedCount} skipped</span>}
                </div>
                <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(sentCount / sendableLeads.length) * 100}%` }} />
                </div>
              </div>

              {currentIdx < sendableLeads.length && (
                <div className="p-4 rounded-xl border border-border bg-surface2">
                  <p className="text-sm font-medium text-text mb-1">{sendableLeads[currentIdx].name}</p>
                  <p className="text-xs text-muted mb-3">{sendableLeads[currentIdx].phone}</p>
                  <p className="text-sm text-text whitespace-pre-wrap">{replaceVars(message, sendableLeads[currentIdx])}</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-2xl font-bold text-text">{countdown}</p>
                <p className="text-xs text-muted">Next message in...</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-center gap-3">
              <button onClick={handlePause} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text hover:bg-surface2 transition-colors">
                {paused ? <Play size={15} /> : <Pause size={15} />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={handleSkip} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text hover:bg-surface2 transition-colors">
                <SkipForward size={15} />
                Skip
              </button>
              <button onClick={() => { pausedRef.current = true; setSending(false); setScreen('done'); onComplete(sentCount); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-danger/50 text-danger text-sm hover:bg-danger/10 transition-colors">
                Stop
              </button>
            </div>
          </>
        )}

        {screen === 'done' && (
          <>
            <div className="px-6 py-8 text-center space-y-4">
              <div className="text-5xl">✓</div>
              <h3 className="text-xl font-semibold text-text">Done! {sentCount} messages queued</h3>
              <div className="space-y-1">
                <p className="text-sm text-muted">{sentCount} leads marked as Contacted</p>
                <p className="text-sm text-muted">{sentCount} credits used — {Math.max(0, balance - sentCount)} credits remaining</p>
                {failedCount > 0 && <p className="text-sm text-danger">{failedCount} failed</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-center gap-3">
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
