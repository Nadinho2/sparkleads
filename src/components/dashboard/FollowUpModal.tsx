'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types';

interface ExistingReminder {
  id: string;
  due_date: string;
  note: string | null;
  status: string;
}

interface FollowUpModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (leadId: string) => void;
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const quickOptions = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 2 days', days: 2 },
  { label: 'In 3 days', days: 3 },
  { label: 'In 1 week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
];

export function FollowUpModal({ lead, isOpen, onClose, onSaved }: FollowUpModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingReminder, setExistingReminder] = useState<ExistingReminder | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [editing, setEditing] = useState(false);

  const tomorrow = addDays(new Date(), 1);

  useEffect(() => {
    if (isOpen && lead) {
      setDueDate('');
      setNote('');
      setExistingReminder(null);
      setEditing(false);
      setLoadingExisting(true);

      fetch(`/api/reminders/list?lead_id=${lead.id}`)
        .then((r) => r.json())
        .then((data) => {
          const reminders = data.reminders || [];
          const existing = reminders.find(
            (r: ExistingReminder & { lead_id?: string }) =>
              r.status === 'pending' || r.status === 'snoozed'
          );
          if (existing) {
            setExistingReminder(existing);
            setDueDate(existing.due_date);
            setNote(existing.note || '');
          }
        })
        .catch(() => {})
        .finally(() => setLoadingExisting(false));
    }
  }, [isOpen, lead]);

  const handleQuickDate = (days: number) => {
    setDueDate(addDays(new Date(), days));
  };

  const handleSave = async () => {
    if (!lead || !dueDate) return;

    setSaving(true);
    try {
      const res = await fetch('/api/reminders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          due_date: dueDate,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const dateStr = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        toast.success(`Reminder set for ${dateStr}`);
        onSaved(lead.place_id);
        onClose();
      } else {
        toast.error(data.error || 'Failed to save reminder');
      }
    } catch {
      toast.error('Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReminder) return;

    try {
      await fetch('/api/reminders/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existingReminder.id }),
      });
      toast.success('Reminder deleted');
      setExistingReminder(null);
      setDueDate('');
      setNote('');
      setEditing(false);
      onSaved(lead!.place_id);
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-text">Set Follow-up Reminder</h3>
            <p className="text-sm text-muted mt-0.5">{lead.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loadingExisting ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : existingReminder && !editing ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Active Reminder</span>
              </div>
              <p className="text-sm text-text">
                Due: {new Date(existingReminder.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {existingReminder.note && (
                <p className="text-sm text-muted">{existingReminder.note}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-lg bg-surface2 text-sm text-text hover:bg-border transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Delete reminder
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-text mb-2 block">Quick select</label>
                <div className="flex flex-wrap gap-2">
                  {quickOptions.map((opt) => {
                    const dateVal = addDays(new Date(), opt.days);
                    const isActive = dueDate === dateVal;
                    return (
                      <button
                        key={opt.days}
                        onClick={() => handleQuickDate(opt.days)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-surface2 text-muted hover:text-text hover:bg-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text mb-2 block">Or pick a date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={tomorrow}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text mb-2 block">
                  Add a note <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="e.g. Spoke to manager, call back after weekend"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                />
                <p className="text-xs text-muted mt-1 text-right">{note.length}/200</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
          {(editing || !existingReminder) && (
            <button
              onClick={handleSave}
              disabled={!dueDate || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Clock size={15} />
              )}
              {editing ? 'Update Reminder' : 'Save Reminder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
