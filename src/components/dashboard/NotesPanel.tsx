'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Clock, MessageCircle, Bell, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types';

interface NoteRecord {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NotesPanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved: (leadId: string, content: string) => void;
  onNoteDeleted: (leadId: string) => void;
  onOpenFollowUp?: (lead: Lead) => void;
  onMarkContacted?: (leadId: string) => void;
}

export function NotesPanel({
  lead,
  isOpen,
  onClose,
  onNoteSaved,
  onNoteDeleted,
  onOpenFollowUp,
  onMarkContacted,
}: NotesPanelProps) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [noteRecord, setNoteRecord] = useState<NoteRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (lead && isOpen) {
      setContent(lead.note || '');
      setSaveStatus('idle');
      setNoteRecord(null);
      setCopied(false);

      if (lead.note) {
        fetch(`/api/notes/get?lead_id=${lead.id}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.note) {
              setNoteRecord(data.note);
            }
          })
          .catch(() => {});
      }

      setTimeout(() => textareaRef.current?.focus(), 100);
    }

    return () => {
      clearTimeout(saveTimerRef.current);
    };
  }, [lead, isOpen]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setSaveStatus('saving');

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!lead) return;

      if (value.trim() === '') {
        await fetch('/api/notes/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id }),
        });
        onNoteDeleted(lead.id);
        setNoteRecord(null);
      } else {
        const res = await fetch('/api/notes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id, content: value }),
        });
        const data = await res.json();
        if (data.note) {
          setNoteRecord(data.note);
        }
        onNoteSaved(lead.id, value);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleDelete = async () => {
    if (!lead) return;

    await fetch('/api/notes/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    });
    setContent('');
    setNoteRecord(null);
    onNoteDeleted(lead.id);
    toast.success('Note deleted');
  };

  const handleCopyPhone = async () => {
    if (!lead?.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleOpenWhatsApp = () => {
    if (!lead?.phone) return;
    const digits = lead.phone.replace(/\D/g, '');
    let formatted = digits;
    if (digits.startsWith('0')) formatted = '234' + digits.slice(1);
    else if (!digits.startsWith('234')) formatted = digits;
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen || !lead) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="text-xs text-muted animate-pulse">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-400">Saved ✓</span>
            )}
            {noteRecord && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete note"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text">{lead.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
            {lead.phone && <span>{lead.phone}</span>}
            {lead.rating && <span>{lead.rating} ★</span>}
          </div>
          {lead.address && (
            <p className="text-xs text-muted mt-1 truncate">{lead.address}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Add your notes about this business..."
            className="w-full h-full min-h-[200px] px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none text-sm leading-relaxed"
          />
        </div>

        {noteRecord && (
          <div className="px-5 py-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Clock size={11} />
              <span>Created {formatDate(noteRecord.created_at)}</span>
            </div>
            {noteRecord.updated_at !== noteRecord.created_at && (
              <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                <Clock size={11} />
                <span>Updated {formatDate(noteRecord.updated_at)}</span>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 border-t border-border space-y-2">
          <p className="text-xs text-muted font-medium uppercase tracking-wider mb-2">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {onOpenFollowUp && (
              <button
                onClick={() => onOpenFollowUp(lead)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface2 text-xs text-muted hover:text-text hover:bg-border transition-colors"
              >
                <Bell size={13} />
                Set Follow-up
              </button>
            )}
            {onMarkContacted && lead.status === 'new' && (
              <button
                onClick={() => onMarkContacted(lead.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface2 text-xs text-muted hover:text-text hover:bg-border transition-colors"
              >
                <Check size={13} />
                Mark Contacted
              </button>
            )}
            {lead.phone && (
              <button
                onClick={handleCopyPhone}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface2 text-xs text-muted hover:text-text hover:bg-border transition-colors"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy Phone'}
              </button>
            )}
            {lead.phone && (
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 text-xs text-green-400 hover:bg-green-600/30 transition-colors"
              >
                <MessageCircle size={13} />
                Open WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
