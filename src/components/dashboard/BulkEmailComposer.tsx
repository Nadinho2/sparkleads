'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mail, AlertTriangle } from 'lucide-react';
import type { Lead } from '@/types';

interface BulkEmailComposerProps {
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

function replaceVars(template: string, lead: Lead): string {
  return template
    .replace(/\{name\}/g, lead.name)
    .replace(/\{city\}/g, extractCity(lead.address))
    .replace(/\{address\}/g, lead.address || '')
    .replace(/\{rating\}/g, lead.rating ? String(lead.rating) : '');
}

export function BulkEmailComposer({ leads, isOpen, onClose, onComplete }: BulkEmailComposerProps) {
  const [screen, setScreen] = useState<Screen>('compose');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [hasSender, setHasSender] = useState(false);
  const [balance, setBalance] = useState(0);
  const [recipientLeads, setRecipientLeads] = useState<Lead[]>(leads);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setScreen('compose');
      setSubject('');
      setBody('');
      setPreview(false);
      setRecipientLeads(leads);
      setSentCount(0);
      setFailedCount(0);
      setCurrentName('');
      setProgress(0);
      fetch('/api/settings/email')
        .then((res) => res.json())
        .then((data) => {
          setSenderEmail(data.senderEmail || '');
          setHasSender(!!data.senderEmail);
        })
        .catch(() => {});
      fetch('/api/credits/ensure')
        .then((res) => res.json())
        .then((data) => setBalance(data.balance ?? 0))
        .catch(() => setBalance(0));
    }
  }, [isOpen, leads]);

  const insertVariable = (key: string, target: 'subject' | 'body') => {
    if (target === 'body') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.slice(0, start) + key + body.slice(end);
      setBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + key.length, start + key.length);
      }, 0);
    } else {
      setSubject((prev) => prev + key);
    }
  };

  const removeRecipient = (placeId: string) => {
    setRecipientLeads((prev) => prev.filter((l) => l.place_id !== placeId));
  };

  const emailLeads = recipientLeads.filter((l) => l.email);
  const effectiveCount = Math.min(emailLeads.length, balance);
  const notEnough = balance < emailLeads.length;

  const startSending = async () => {
    setScreen('sending');
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emailLeads.length; i++) {
      if (balance - sent <= 0) break;

      const lead = emailLeads[i];
      setCurrentName(lead.name);
      setProgress(((i + 1) / emailLeads.length) * 100);

      try {
        const res = await fetch('/api/outreach/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: [{ email: lead.email, name: lead.name, place_id: lead.place_id }],
            subject: replaceVars(subject, lead),
            body: replaceVars(body, lead),
          }),
        });
        const data = await res.json();
        if (res.ok && data.results?.[0]?.success) {
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

      if (i < emailLeads.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setScreen('done');
    onComplete(sent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={screen === 'sending' ? undefined : onClose} />
      <div className="relative z-50 w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {screen === 'compose' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Send Email to {emailLeads.length} businesses</h3>
                  {leads.length > emailLeads.length && (
                    <p className="text-xs text-warning">{leads.length - emailLeads.length} of {leads.length} selected have no email</p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-border space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted w-12">From:</span>
                {hasSender ? <span className="text-sm text-text">{senderEmail}</span> : <span className="flex items-center gap-1.5 text-xs text-warning"><AlertTriangle className="w-3.5 h-3.5" /> Set up sender email in Settings first</span>}
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Recipients:</p>
                <div className="flex flex-wrap gap-2">
                  {recipientLeads.filter((l) => l.email).slice(0, 5).map((l) => (
                    <span key={l.place_id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface2 text-xs text-text">
                      {l.name}
                      <button onClick={() => removeRecipient(l.place_id)} className="text-muted hover:text-danger"><X size={12} /></button>
                    </span>
                  ))}
                  {emailLeads.length > 5 && <span className="px-3 py-1 rounded-full bg-surface2 text-xs text-muted">+{emailLeads.length - 5} more</span>}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your email subject..." className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                <div className="flex gap-2 mt-1.5">
                  {variables.slice(0, 2).map((v) => <button key={v.key} onClick={() => insertVariable(v.key, 'subject')} className="text-xs text-primary hover:underline">{v.key}</button>)}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setPreview(false)} className={`px-3 py-1 rounded-lg text-xs font-medium ${!preview ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text'}`}>Edit</button>
                <button onClick={() => setPreview(true)} className={`px-3 py-1 rounded-lg text-xs font-medium ${preview ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text'}`}>Preview</button>
              </div>

              {preview ? (
                <div className="p-4 rounded-lg bg-surface2 border border-border min-h-[120px]">
                  <p className="text-sm font-medium text-text mb-3">{replaceVars(subject, emailLeads[0] || leads[0]) || '(No subject)'}</p>
                  <p className="text-sm text-muted whitespace-pre-wrap">{replaceVars(body, emailLeads[0] || leads[0]) || '(Empty body)'}</p>
                </div>
              ) : (
                <div>
                  <textarea ref={textareaRef} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." rows={6} className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none" />
                  <div className="flex gap-2 mt-1.5">
                    {variables.map((v) => <button key={v.key} onClick={() => insertVariable(v.key, 'body')} className="text-xs text-primary hover:underline">{v.key}</button>)}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border space-y-3">
              {notEnough && <p className="text-xs text-warning">Not enough credits. You can send to {balance} emails with your current balance.</p>}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Uses <span className="text-yellow-400 font-semibold">{effectiveCount} credits</span> · Balance: {balance}</p>
                <button onClick={startSending} disabled={!body.trim() || !subject.trim() || emailLeads.length === 0 || !hasSender || balance === 0} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Send {effectiveCount} Emails
                </button>
              </div>
            </div>
          </>
        )}

        {screen === 'sending' && (
          <>
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text">Sending emails...</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text">{sentCount} of {emailLeads.length} sent</span>
                  {failedCount > 0 && <span className="text-xs text-danger">{failedCount} failed</span>}
                </div>
                <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="text-center py-8">
                <p className="text-sm text-muted">Sending to <span className="text-text font-medium">{currentName}</span>...</p>
              </div>
            </div>
          </>
        )}

        {screen === 'done' && (
          <>
            <div className="px-6 py-8 text-center space-y-4">
              <div className="text-5xl">✓</div>
              <h3 className="text-xl font-semibold text-text">{sentCount} emails sent</h3>
              {failedCount > 0 && <p className="text-sm text-danger">{failedCount} failed</p>}
              <p className="text-sm text-muted">{sentCount} credits used — {Math.max(0, balance - sentCount)} credits remaining</p>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-center">
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
