'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

interface CalendarEvent {
  id: string;
  profile_id: string;
  content_id: string | null;
  platform: string;
  scheduled_date: string;
  scheduled_time: string | null;
  caption: string;
  hashtags: string[] | null;
  image_direction: string | null;
  status: string;
  profile: { business_name: string; business_type: string } | null;
}

interface Profile {
  id: string;
  business_name: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tiktok: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  twitter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  linkedin: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  whatsapp: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '👥',
  tiktok: '🎵',
  twitter: '🐦',
  linkedin: '💼',
  whatsapp: '💬',
};

export default function ContentCalendarPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [moreEvents, setMoreEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [profileFilter, setProfileFilter] = useState('');

  const [schedProfileId, setSchedProfileId] = useState('');
  const [schedPlatform, setSchedPlatform] = useState('instagram');
  const [schedTime, setSchedTime] = useState('10:00');
  const [schedCaption, setSchedCaption] = useState('');
  const [schedHashtags, setSchedHashtags] = useState('');
  const [schedImageDir, setSchedImageDir] = useState('');
  const [saving, setSaving] = useState(false);

  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const loadEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ month: monthStr });
      if (profileFilter) params.set('profile_id', profileFilter);
      const res = await fetch(`/api/content/calendar?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      console.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [monthStr, profileFilter]);

  useEffect(() => {
    loadEvents();
    fetch('/api/content/profile')
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles || []))
      .catch(() => {});

    const caption = searchParams.get('caption');
    if (caption) {
      setSchedCaption(caption);
      setSchedHashtags(searchParams.get('hashtags') || '');
      setSchedImageDir(searchParams.get('image_direction') || '');
      setSchedProfileId(searchParams.get('profile_id') || '');
      setSchedPlatform(searchParams.get('platform') || 'instagram');
      setScheduleDate(new Date().toISOString().split('T')[0]);
      setShowScheduleModal(true);
    }
  }, [loadEvents, searchParams]);

  const daysInMonth = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    return days;
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const key = e.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSchedule = async () => {
    if (!schedProfileId || !schedCaption || !scheduleDate) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: schedProfileId,
          platform: schedPlatform,
          scheduled_date: scheduleDate,
          scheduled_time: schedTime,
          caption: schedCaption,
          hashtags: schedHashtags ? schedHashtags.split(',').map((h) => h.trim()) : null,
          image_direction: schedImageDir || null,
        }),
      });

      if (res.ok) {
        toast.success('Content scheduled');
        setShowScheduleModal(false);
        resetScheduleForm();
        loadEvents();
      } else {
        toast.error('Failed to schedule');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const resetScheduleForm = () => {
    setSchedProfileId('');
    setSchedPlatform('instagram');
    setSchedTime('10:00');
    setSchedCaption('');
    setSchedHashtags('');
    setSchedImageDir('');
    setScheduleDate('');
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/content/calendar?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setSelectedEvent(null);
        toast.success('Event removed');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Content Calendar</h1>
          <p className="text-sm text-muted mt-1">Plan and schedule your content.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="rounded-lg border bg-surface px-3 py-2 text-sm text-text border-border focus:outline-none"
          >
            <option value="">All Clients</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
          </select>
          <button
            onClick={() => { resetScheduleForm(); setShowScheduleModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Schedule Content
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text">{monthName}</h2>
          <button onClick={goToToday} className="px-3 py-1 rounded-lg bg-surface2 text-xs text-muted hover:text-text border border-border">Today</button>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-6 h-6 text-primary" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted py-2">{d}</div>
          ))}
          {daysInMonth.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square" />;
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const dateKey = `${y}-${m}-${d}`;
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = dateKey === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dateKey}
                className={`aspect-square p-1 rounded-lg border transition-colors cursor-pointer ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                }`}
                onClick={() => { setScheduleDate(dateKey); resetScheduleForm(); setScheduleDate(dateKey); }}
              >
                <p className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted'}`}>{day}</p>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <button
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                      className={`w-full text-left px-1 py-0.5 rounded text-[10px] truncate border ${PLATFORM_COLORS[e.platform] || 'bg-surface2 text-muted'}`}
                    >
                      {PLATFORM_ICONS[e.platform]} {e.profile?.business_name}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setMoreEvents({ date: dateKey, events: dayEvents });
                      }}
                      className="w-full text-[10px] text-muted text-center hover:text-text transition-colors"
                      title="Show all scheduled content"
                    >
                      +{dayEvents.length - 2}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {moreEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoreEvents(null)} />
          <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text">More scheduled content</h3>
                <p className="text-xs text-muted mt-0.5">{moreEvents.date}</p>
              </div>
              <button
                onClick={() => setMoreEvents(null)}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {moreEvents.events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setMoreEvents(null);
                    setSelectedEvent(e);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border bg-surface2 hover:bg-surface2/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {PLATFORM_ICONS[e.platform]} {e.profile?.business_name || 'Scheduled content'}
                      </p>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {e.scheduled_time ? `${e.scheduled_time} • ` : ''}{e.platform}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${PLATFORM_COLORS[e.platform] || 'bg-surface2 text-muted border-border'}`}>
                      {e.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">{selectedEvent.profile?.business_name}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="p-1.5 rounded-lg text-danger hover:bg-danger/10"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${PLATFORM_COLORS[selectedEvent.platform]}`}>{PLATFORM_ICONS[selectedEvent.platform]} {selectedEvent.platform}</span>
                <span className="text-xs text-muted">{selectedEvent.scheduled_date} {selectedEvent.scheduled_time}</span>
              </div>
              <div className="p-4 rounded-lg bg-surface2">
                <p className="text-xs text-muted mb-1">Caption</p>
                <p className="text-sm text-text whitespace-pre-wrap">{selectedEvent.caption}</p>
              </div>
              {selectedEvent.hashtags && selectedEvent.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedEvent.hashtags.map((tag, i) => <span key={i} className="text-xs text-purple-400">{tag}</span>)}
                </div>
              )}
              {selectedEvent.image_direction && (
                <div className="p-3 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1">Image Direction</p>
                  <p className="text-xs text-text">{selectedEvent.image_direction}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
          <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Schedule Content</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Client *</label>
              <select value={schedProfileId} onChange={(e) => setSchedProfileId(e.target.value)} className="w-full rounded-lg border bg-surface2 px-3 py-2.5 text-sm text-text border-border focus:outline-none">
                <option value="">Select client...</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Date *</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full rounded-lg border bg-surface2 px-3 py-2.5 text-sm text-text border-border focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Time</label>
                <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} className="w-full rounded-lg border bg-surface2 px-3 py-2.5 text-sm text-text border-border focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Platform</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_ICONS).map(([key, icon]) => (
                  <button key={key} onClick={() => setSchedPlatform(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${schedPlatform === key ? 'bg-primary text-white' : 'bg-surface2 text-muted border border-border'}`}>{icon} {key}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Caption *</label>
              <textarea value={schedCaption} onChange={(e) => setSchedCaption(e.target.value)} rows={4} className="w-full rounded-lg border bg-surface2 px-3 py-2.5 text-sm text-text border-border focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Hashtags <span className="text-xs text-muted">(comma separated)</span></label>
              <input value={schedHashtags} onChange={(e) => setSchedHashtags(e.target.value)} className="w-full rounded-lg border bg-surface2 px-3 py-2.5 text-sm text-text border-border focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Image Direction</label>
              <input value={schedImageDir} onChange={(e) => setSchedImageDir(e.target.value)} className="w-full rounded-lg border bg-surface2 px-3 py-2.5 text-sm text-text border-border focus:outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2.5 rounded-lg text-sm text-muted hover:text-text hover:bg-surface2">Cancel</button>
              <button onClick={handleSchedule} disabled={saving || !schedProfileId || !schedCaption} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Spinner size="sm" /> : null}
                Save to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
