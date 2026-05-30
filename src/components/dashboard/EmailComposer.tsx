'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mail, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types';

interface EmailComposerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSent: (placeId: string, balance: number) => void;
}

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

export function EmailComposer({ lead, isOpen, onClose, onSent }: EmailComposerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [hasSender, setHasSender] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setBody('');
      setPreview(false);
      fetch('/api/settings/email')
        .then((res) => res.json())
        .then((data) => {
          setSenderEmail(data.senderEmail || '');
          setHasSender(!!data.senderEmail);
        })
        .catch(() => {});
    }
  }, [isOpen]);

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

  const handleSend = async () => {
    if (!lead || !body.trim() || !subject.trim()) return;

    setSending(true);
    try {
      const personalizedSubject = replaceVars(subject, lead);
      const personalizedBody = replaceVars(body, lead);

      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ email: lead.email, name: lead.name, place_id: lead.place_id }],
          subject: personalizedSubject,
          body: personalizedBody,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const result = data.results?.[0];
        if (result?.success) {
          toast.success('Email sent — 1 credit used');
          onSent(lead.place_id, data.credits_remaining ?? 0);
          onClose();
        } else {
          toast.error(result?.error || 'Failed to send email');
        }
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !lead) return null;

  const previewSubject = replaceVars(subject, lead);
  const previewBody = replaceVars(body, lead);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-text">Send Email</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-border bg-surface2/50 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted w-12">To:</span>
            <span className="text-sm text-text">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted w-12">From:</span>
            {hasSender ? (
              <span className="text-sm text-text">{senderEmail}</span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-warning">
                <AlertTriangle className="w-3.5 h-3.5" />
                Set up sender email in Settings first
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your email subject..."
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
            <div className="flex gap-2 mt-1.5">
              {variables.slice(0, 2).map((v) => (
                <button key={v.key} onClick={() => insertVariable(v.key, 'subject')} className="text-xs text-primary hover:underline">
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPreview(false)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!preview ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text'}`}>
              Edit
            </button>
            <button onClick={() => setPreview(true)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${preview ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text'}`}>
              Preview
            </button>
          </div>

          {preview ? (
            <div className="p-4 rounded-lg bg-surface2 border border-border min-h-[120px]">
              <p className="text-sm font-medium text-text mb-3">{previewSubject || '(No subject)'}</p>
              <p className="text-sm text-muted whitespace-pre-wrap">{previewBody || '(Empty body)'}</p>
            </div>
          ) : (
            <div>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
              />
              <div className="flex gap-2 mt-1.5">
                {variables.map((v) => (
                  <button key={v.key} onClick={() => insertVariable(v.key, 'body')} className="text-xs text-primary hover:underline">
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-muted text-sm font-medium hover:text-text transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !body.trim() || !subject.trim() || !hasSender}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Email →'}
            <span className="text-xs opacity-70">(1 credit)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
