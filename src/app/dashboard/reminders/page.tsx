'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Calendar, Check, MessageCircle, Trash2, AlertTriangle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppComposer } from '@/components/dashboard/WhatsAppComposer';
import { FollowUpModal } from '@/components/dashboard/FollowUpModal';
import type { Lead } from '@/types';

interface Reminder {
  id: string;
  lead_id: string;
  due_date: string;
  note: string | null;
  status: string;
  created_at: string;
  lead: Lead | null;
}

type FilterTab = 'all' | 'today' | 'upcoming' | 'done';

const tabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Due Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'done', label: 'Done' },
];

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateStatus(dueDate: string, status: string): 'overdue' | 'today' | 'upcoming' | 'done' {
  if (status === 'done') return 'done';
  const today = getTodayStr();
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

const dateStatusColors: Record<string, string> = {
  overdue: 'text-red-400',
  today: 'text-yellow-400',
  upcoming: 'text-gray-400',
  done: 'text-green-400',
};

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  done: 'bg-green-500/20 text-green-400',
  snoozed: 'bg-blue-500/20 text-blue-400',
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [whatsappComposer, setWhatsappComposer] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [followUpModal, setFollowUpModal] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });

  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders/list');
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const markDone = async (id: string) => {
    try {
      await fetch('/api/reminders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done' }),
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'done' } : r))
      );
      toast.success('Marked as done');
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await fetch('/api/reminders/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success('Reminder deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = reminders.filter((r) => {
    const ds = getDateStatus(r.due_date, r.status);
    switch (activeTab) {
      case 'today':
        return ds === 'today' || ds === 'overdue';
      case 'upcoming':
        return ds === 'upcoming' && r.status !== 'done';
      case 'done':
        return r.status === 'done';
      default:
        return true;
    }
  });

  const overdueCount = reminders.filter(
    (r) => r.status === 'pending' && getDateStatus(r.due_date, r.status) === 'overdue'
  ).length;

  const handleReminderSaved = () => {
    loadReminders();
    setFollowUpModal({ isOpen: false, lead: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Follow-up Reminders</h1>
          <p className="text-sm text-muted mt-1">
            Manage your follow-up schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">
            {reminders.filter((r) => r.status === 'pending').length} pending
          </span>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400 font-medium">
            {overdueCount} reminder{overdueCount > 1 ? 's' : ''} overdue
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-surface w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'text-muted hover:text-text'
            }`}
          >
            {tab.label}
            {tab.value === 'today' && overdueCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-1">No reminders</h3>
          <p className="text-sm text-muted">
            {activeTab === 'all'
              ? 'Set a follow-up reminder from your search results'
              : `No ${activeTab === 'today' ? 'due today' : activeTab} reminders`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Note
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reminder) => {
                  const ds = getDateStatus(reminder.due_date, reminder.status);
                  const formattedDate = new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={reminder.id}
                      className="border-b border-border/50 hover:bg-surface2/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-text">
                        {reminder.lead?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {reminder.lead?.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted max-w-[200px] truncate">
                        {reminder.note || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1.5 text-sm font-medium ${dateStatusColors[ds]}`}>
                          <Calendar size={13} />
                          {formattedDate}
                          {ds === 'overdue' && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadgeColors[reminder.status] || 'bg-surface2 text-muted'}`}>
                          {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {reminder.lead?.phone && reminder.status !== 'done' && (
                            <button
                              onClick={() => setWhatsappComposer({ isOpen: true, lead: reminder.lead as Lead })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors"
                              title="Send WhatsApp"
                            >
                              <MessageCircle size={12} />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </button>
                          )}
                          {reminder.status !== 'done' && (
                            <button
                              onClick={() => setFollowUpModal({ isOpen: true, lead: reminder.lead as Lead })}
                              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit reminder"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {reminder.status !== 'done' && (
                            <button
                              onClick={() => markDone(reminder.id)}
                              className="p-1.5 rounded-lg text-muted hover:text-green-400 hover:bg-green-500/10 transition-colors"
                              title="Mark done"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <WhatsAppComposer
        lead={whatsappComposer.lead}
        isOpen={whatsappComposer.isOpen}
        onClose={() => setWhatsappComposer({ isOpen: false, lead: null })}
        onSent={() => {}}
      />

      <FollowUpModal
        lead={followUpModal.lead}
        isOpen={followUpModal.isOpen}
        onClose={() => setFollowUpModal({ isOpen: false, lead: null })}
        onSaved={handleReminderSaved}
      />
    </div>
  );
}
