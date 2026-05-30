'use client';

import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types';

interface WhatsAppComposerProps {
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

export function WhatsAppComposer({ lead, isOpen, onClose, onSent }: WhatsAppComposerProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
    }
  }, [isOpen]);

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

  const handleSend = async () => {
    if (!lead || !message.trim()) return;

    setSending(true);
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

      const data = await res.json();
      if (res.ok) {
        toast.success(`WhatsApp opened — 1 credit used. Balance: ${data.balance_after} credits`);
        onSent(lead.place_id, data.balance_after);
        onClose();
      } else if (data.error === 'insufficient_credits') {
        toast.error('Insufficient credits. Visit Credits page to top up.');
      } else {
        toast.error(data.error || 'Failed to deduct credit');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !lead) return null;

  const preview = replaceVars(message || '', lead);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-text">Send WhatsApp Message</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-border bg-surface2/50">
          <p className="text-sm text-muted">To:</p>
          <p className="text-sm font-medium text-text">{lead.name}</p>
          <p className="text-xs text-muted">{lead.phone}</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={"Write your message...\nUse {name} to insert business name, {city} for their city"}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
            />
            <p className="text-xs text-muted mt-1 text-right">{message.length} / 500</p>
          </div>

          <div>
            <p className="text-xs text-muted mb-2">Variables (click to insert):</p>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="px-3 py-1.5 rounded-lg bg-surface2 border border-border text-xs text-text hover:border-primary/50 transition-colors"
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className="p-4 rounded-lg bg-surface2 border border-border">
              <p className="text-xs text-muted mb-2">Preview:</p>
              <p className="text-sm text-text whitespace-pre-wrap">{preview}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-muted text-sm font-medium hover:text-text transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send WhatsApp →'}
            <span className="text-xs opacity-70">(1 credit)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
