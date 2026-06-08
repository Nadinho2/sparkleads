'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Edit3,
  Zap,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
import { ProfileEditor } from '@/components/content/ProfileEditor';

interface ContentProfile {
  id: string;
  lead_id: string | null;
  business_name: string;
  business_type: string;
  location: string | null;
  website: string | null;
  website_excerpt?: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  twitter: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  services: string[] | null;
  tagline: string | null;
  brand_voice: string | null;
  target_audience: string | null;
  usp: string | null;
  updated_at: string;
}

interface Variation {
  id: number;
  approach: string;
  hook: string;
  caption: string;
  hashtags: string[];
  hashtag_string?: string;
  image_direction: string;
  video_direction: string;
  cta: string;
  best_time: string;
  format: string;
  emoji_suggestion?: string;
  engagement_tip: string;
}

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', icon: '👥', color: '#1877F2' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#010101' },
  { key: 'twitter', label: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
];

const CONTENT_TYPES = [
  'Promotional', 'Educational', 'Engagement', 'Behind the Scenes',
  'Product/Service Highlight', 'Testimonial', 'Seasonal/Holiday', 'Announcement',
];

const GOALS = [
  'Get more customers',
  'Promote a specific offer',
  'Build brand awareness',
  'Drive website traffic',
  'Get phone calls / WhatsApp messages',
  'Grow followers',
  'Showcase a product or service',
];

const TONE_OPTIONS = [
  { value: '', label: 'Use saved voice' },
  { value: 'professional', label: 'More formal' },
  { value: 'friendly', label: 'More casual' },
  { value: 'bold', label: 'More urgent' },
];

const APPROACH_COLORS: Record<string, string> = {
  'Hook-based': 'bg-purple-500/20 text-purple-400',
  'Problem/Solution': 'bg-red-500/20 text-red-400',
  'Social proof': 'bg-green-500/20 text-green-400',
  'Direct promotional': 'bg-yellow-500/20 text-yellow-400',
  'Educational': 'bg-blue-500/20 text-blue-400',
};

export default function ContentPage() {
  const basePath = useBasePath();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ContentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<Record<string, unknown> | null>(null);
  const [editorLeadId, setEditorLeadId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [variationCount, setVariationCount] = useState(5);
  const [contentType, setContentType] = useState('');
  const [goal, setGoal] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [toneOverride, setToneOverride] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, { variations: Variation[] }> | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const [genMode, setGenMode] = useState<'single' | 'calendar'>('single');
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false);
  const [calendarResult, setCalendarResult] = useState<{
    month: string;
    total_posts: number;
    platforms: string[];
    credits_used: number;
    new_balance: number;
    posts: { date: string; time: string; platform: string; content_type: string; hook: string; caption: string; format: string }[];
  } | null>(null);

  const loadProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/content/profile');
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch {
      console.error('Failed to load profiles');
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    fetch('/api/credits/ensure')
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(0));

    const stored = localStorage.getItem('sparkleads_content_lead');
    if (stored) {
      try {
        const lead = JSON.parse(stored);
        handleLeadPrefill(lead);
      } catch { /* ignore */ }
      localStorage.removeItem('sparkleads_content_lead');
    }
  }, [loadProfiles]);

  const handleLeadPrefill = async (lead: { id: string; name: string; type?: string; address?: string; website?: string; phone?: string }) => {
    try {
      const res = await fetch(`/api/content/profile?lead_id=${lead.id}`);
      const data = await res.json();
      if (data.exists) {
        setSelectedProfile(data.profile);
      } else {
        let prefilled = data.prefilled;
        const websiteUrl = String(prefilled?.website || '').trim();
        if (websiteUrl) {
          try {
            const readRes = await fetch('/api/content/read-website', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: websiteUrl }),
            });
            const readData = await readRes.json();
            if (readData?.success) {
              prefilled = {
                ...prefilled,
                website_excerpt: readData.excerpt || '',
                tagline: prefilled?.tagline || (readData.description ? String(readData.description).slice(0, 100) : ''),
                phone: prefilled?.phone || readData.phone || '',
              };
            }
          } catch {
          }
        }
        setEditorData(prefilled);
        setEditorLeadId(lead.id);
        setEditorOpen(true);
      }
    } catch {
      toast.error('Failed to load lead data');
    }
  };

  const filteredProfiles = profiles.filter((p) =>
    p.business_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const getCreditCost = (count: number) => {
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    return 3;
  };

  const creditCost = getCreditCost(variationCount);

  const calendarCreditCost = postsPerWeek * 4 * selectedPlatforms.length;

  const getMonthLabel = (val: string) => {
    const [y, m] = val.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const formatHashtags = (hashtagString: string) => {
    if (!hashtagString) return '';
    return hashtagString.replace(/#/g, ' #').replace(/\s+/g, ' ').trim();
  };

  const handleGenerate = async () => {
    if (!selectedProfile || !selectedPlatforms.length || !contentType || !goal) return;

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedProfile.id,
          platforms: selectedPlatforms,
          content_type: contentType,
          goal,
          variation_count: variationCount,
          extra_context: extraContext || undefined,
          tone_override: toneOverride || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'insufficient_credits') {
          toast.error(`Not enough credits. You need ${creditCost} credits.`);
          return;
        }
        toast.error(data.error || data.details || 'Failed to generate content');
        return;
      }

      setGeneratedContent(data.content.platforms);
      setActivePlatformTab(selectedPlatforms[0]);
      setBalance((prev) => prev - creditCost);
      toast.success('Content generated successfully!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCalendar = async () => {
    if (!selectedProfile || !selectedPlatforms.length || !goal) return;

    setIsGeneratingCalendar(true);
    setCalendarResult(null);

    try {
      const res = await fetch('/api/content/calendar-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedProfile.id,
          platforms: selectedPlatforms,
          goal,
          posts_per_week: postsPerWeek,
          month: calendarMonth,
          tone_override: toneOverride || undefined,
          extra_context: extraContext || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'insufficient_credits') {
          toast.error(`Not enough credits. You need ${data.required} credits.`);
          return;
        }
        toast.error(data.error || data.details || 'Failed to generate calendar');
        return;
      }

      setCalendarResult(data);
      setBalance(data.new_balance);
      toast.success(`${data.total_posts} posts generated and added to your calendar!`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsGeneratingCalendar(false);
    }
  };

  const formatCopyAll = (v: Variation) => {
    const tags = formatHashtags(
      v.hashtag_string || v.hashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' ')
    );
    return `CAPTION:\n${v.caption}\n\nHASHTAGS:\n${tags}\n\nIMAGE DIRECTION:\n${v.image_direction}`;
  };

  const regenerateVariation = async (variationId: number) => {
    if (!selectedProfile || !activePlatformTab || !generatedContent) return;
    const key = `${activePlatformTab}-${variationId}`;
    setRegeneratingId(key);
    try {
      const res = await fetch('/api/content/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedProfile.id,
          platform: activePlatformTab,
          content_type: contentType,
          goal,
          variation_id: variationId,
          approach: APPROACH_NAMES[(variationId - 1) % APPROACH_NAMES.length],
          tone_override: toneOverride || undefined,
          extra_context: extraContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to regenerate');
        return;
      }
      setGeneratedContent((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        const platformResult = updated[activePlatformTab];
        if (platformResult) {
          updated[activePlatformTab] = {
            ...platformResult,
            variations: platformResult.variations.map((v) =>
              v.id === variationId ? { ...data.variation, id: variationId } : v
            ),
          };
        }
        return updated;
      });
      setBalance((prev) => prev - 1);
      toast.success('Variation regenerated!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRegeneratingId(null);
    }
  };

  const APPROACH_NAMES = ['Hook-based', 'Problem/Solution', 'Social proof', 'Direct promotional', 'Educational'];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* LEFT SIDEBAR */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text mb-3">Select Client</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-surface2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {filteredProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProfile(p); setGeneratedContent(null); }}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${
                  selectedProfile?.id === p.id ? 'bg-primary/10' : 'hover:bg-surface2'
                }`}
              >
                <p className="text-sm font-medium text-text truncate">{p.business_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">{p.business_type}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {PLATFORMS.map((pl) => (
                    <span
                      key={pl.key}
                      className="text-xs"
                      style={{
                        opacity: p[pl.key as keyof ContentProfile] ? 1 : 0.3,
                      }}
                    >
                      {pl.icon}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {filteredProfiles.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted text-center">No clients yet</p>
            )}
          </div>
          <div className="p-3 border-t border-border">
            <button
              onClick={() => { setEditorData(null); setEditorLeadId(null); setEditorOpen(true); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Client
            </button>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="space-y-6">
          {/* CLIENT PROFILE CARD */}
          {selectedProfile && (
            <div className="p-5 rounded-xl border border-border bg-surface">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-text">{selectedProfile.business_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted">{selectedProfile.business_type}</span>
                    {selectedProfile.location && <span className="text-xs text-muted">{selectedProfile.location}</span>}
                  </div>
                </div>
                <button
                  onClick={() => { setEditorData(selectedProfile as unknown as Record<string, null>); setEditorLeadId(selectedProfile.lead_id); setEditorOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 text-muted text-xs hover:text-text transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {selectedProfile.instagram && <span className="text-xs text-muted">📸 @{selectedProfile.instagram}</span>}
                {selectedProfile.facebook && <span className="text-xs text-muted">👥 {selectedProfile.facebook}</span>}
                {selectedProfile.tiktok && <span className="text-xs text-muted">🎵 @{selectedProfile.tiktok}</span>}
                {selectedProfile.twitter && <span className="text-xs text-muted">🐦 @{selectedProfile.twitter}</span>}
              </div>
              {selectedProfile.brand_voice && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs capitalize">{selectedProfile.brand_voice}</span>
              )}
              {selectedProfile.services && selectedProfile.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedProfile.services.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-surface2 text-xs text-muted">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CALENDAR RESULTS */}
          {calendarResult && genMode === 'calendar' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      {getMonthLabel(calendarResult.month)} Content Calendar
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {calendarResult.total_posts} posts across {calendarResult.platforms.length} {calendarResult.platforms.length === 1 ? 'platform' : 'platforms'} — {calendarResult.credits_used} credits used
                    </p>
                  </div>
                  <a
                    href={`${basePath}/content/calendar`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    View in Calendar <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="bg-surface2 px-2 py-1.5 text-center text-xs font-medium text-muted">{d}</div>
                  ))}

                  {(() => {
                    const [yr, mn] = calendarResult.month.split('-').map(Number);
                    const firstDay = new Date(yr, mn - 1, 1).getDay();
                    const daysInMonth = new Date(yr, mn, 0).getDate();
                    const cells: (null | typeof calendarResult.posts)[] = [];

                    for (let i = 0; i < firstDay; i++) cells.push(null);
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${yr}-${String(mn).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const dayPosts = calendarResult.posts.filter((p) => p.date === dateStr);
                      cells.push(dayPosts.length > 0 ? dayPosts : null);
                    }

                    return cells.map((dayPosts, i) => (
                      <div key={i} className={`min-h-[80px] p-1.5 ${dayPosts ? 'bg-surface' : 'bg-surface/50'}`}>
                        {dayPosts && (
                          <>
                            <p className="text-xs font-medium text-muted mb-1">
                              {new Date(dayPosts[0].date).getDate()}
                            </p>
                            {dayPosts.map((p, j) => {
                              const pl = PLATFORMS.find((x) => x.key === p.platform);
                              return (
                                <div
                                  key={j}
                                  className="mb-1 px-1.5 py-1 rounded text-[10px] leading-tight bg-primary/10 text-primary truncate"
                                  title={`${p.content_type} — ${p.hook}`}
                                >
                                  {pl?.icon} {p.content_type}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="space-y-3">
                {calendarResult.posts.map((post, i) => {
                  const pl = PLATFORMS.find((x) => x.key === post.platform);
                  return (
                    <div key={i} className="p-4 rounded-xl border border-border bg-surface flex items-start gap-4">
                      <div className="flex-shrink-0 text-center min-w-[60px]">
                        <p className="text-lg font-bold text-text">{new Date(post.date).getDate()}</p>
                        <p className="text-xs text-muted">
                          {new Date(post.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-xs text-primary mt-0.5">{post.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{pl?.icon}</span>
                          <span className="text-sm font-medium text-text">{post.content_type}</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{post.format}</span>
                        </div>
                        <p className="text-sm text-text italic mb-1">&ldquo;{post.hook}&rdquo;</p>
                        <p className="text-xs text-muted truncate">{post.caption}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GENERATION FORM */}
          {selectedProfile && (
            <div className="p-5 rounded-xl border border-border bg-surface space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text">Generate Content</h3>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => { setGenMode('single'); setCalendarResult(null); }}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${genMode === 'single' ? 'bg-primary text-white' : 'bg-surface2 text-muted hover:text-text'}`}
                  >
                    Single Post
                  </button>
                  <button
                    onClick={() => { setGenMode('calendar'); setGeneratedContent(null); }}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${genMode === 'calendar' ? 'bg-primary text-white' : 'bg-surface2 text-muted hover:text-text'}`}
                  >
                    Monthly Calendar
                  </button>
                </div>
              </div>

              {genMode === 'calendar' && (
              <>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Target Month</label>
                <input
                  type="month"
                  value={calendarMonth}
                  onChange={(e) => setCalendarMonth(e.target.value)}
                  className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Posts Per Week</label>
                <div className="flex gap-2">
                  {[
                    { count: 2, label: '2/week', total: '8 posts' },
                    { count: 3, label: '3/week', total: '12 posts' },
                    { count: 4, label: '4/week', total: '16 posts' },
                    { count: 5, label: '5/week', total: '20 posts' },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      onClick={() => setPostsPerWeek(opt.count)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-center ${
                        postsPerWeek === opt.count
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-muted border border-border hover:text-text'
                      }`}
                    >
                      <span className="block">{opt.label}</span>
                      <span className={`block text-xs mt-0.5 ${postsPerWeek === opt.count ? 'text-white/70' : 'text-muted'}`}>
                        {opt.total}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              </>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const hasHandle = selectedProfile[p.key as keyof ContentProfile];
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePlatform(p.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPlatforms.includes(p.key)
                            ? 'bg-primary text-white'
                            : 'bg-surface2 text-muted border border-border hover:text-text'
                        }`}
                      >
                        {hasHandle && <span className="w-2 h-2 rounded-full bg-green-400" />}
                        {p.icon} {p.label}
                      </button>
                    );
                  })}
                </div>
                {selectedPlatforms.some((p) => !selectedProfile[p as keyof ContentProfile]) && (
                  <p className="text-xs text-yellow-400 mt-1.5">Some selected platforms have no handle saved. Content will still generate but won&apos;t include @mention.</p>
                )}
              </div>

              {genMode === 'single' && (
              <>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Content Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setContentType(ct)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        contentType === ct
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-muted border border-border hover:text-text'
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Variations per Platform</label>
                <div className="flex gap-2">
                  {[
                    { count: 1, credits: 1, label: '1 variation' },
                    { count: 3, credits: 2, label: '3 variations' },
                    { count: 5, credits: 3, label: '5 variations' },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      onClick={() => setVariationCount(opt.count)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-center ${
                        variationCount === opt.count
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-muted border border-border hover:text-text'
                      }`}
                    >
                      <span className="block">{opt.label}</span>
                      <span className={`block text-xs mt-0.5 ${variationCount === opt.count ? 'text-white/70' : 'text-muted'}`}>
                        {opt.credits} {opt.credits === 1 ? 'credit' : 'credits'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              </>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 border-border"
                >
                  <option value="">Select a goal...</option>
                  {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Extra Context <span className="text-xs text-muted">(optional)</span></label>
                <textarea
                  value={extraContext}
                  onChange={(e) => { if (e.target.value.length <= 300) setExtraContext(e.target.value); }}
                  placeholder="e.g. '50% off haircut this weekend only' or 'We just got a new steamer machine'"
                  rows={3}
                  className="w-full rounded-lg border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border-border resize-none"
                />
                <p className="text-xs text-muted text-right mt-1">{extraContext.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Tone Override <span className="text-xs text-muted">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setToneOverride(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        toneOverride === t.value
                          ? 'bg-primary text-white'
                          : 'bg-surface2 text-muted border border-border hover:text-text'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-surface2 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={16} className="text-yellow-400" />
                  <div>
                    {genMode === 'single' ? (
                      <>
                        <p className="text-sm font-medium text-text">This uses {creditCost} {creditCost === 1 ? 'credit' : 'credits'}</p>
                        <p className="text-xs text-muted">Your balance: {balance} credits</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-text">This uses {calendarCreditCost} credits ({postsPerWeek * 4} posts × {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'platform' : 'platforms'})</p>
                        <p className="text-xs text-muted">Your balance: {balance} credits</p>
                      </>
                    )}
                  </div>
                </div>
                {genMode === 'single' ? (
                  balance < creditCost && (
                    <a href={`${basePath}/credits`} className="text-xs text-primary underline">Get more credits</a>
                  )
                ) : (
                  balance < calendarCreditCost && (
                    <a href={`${basePath}/credits`} className="text-xs text-primary underline">Get more credits</a>
                  )
                )}
              </div>

              {genMode === 'single' ? (
              <button
                onClick={handleGenerate}
                disabled={!selectedPlatforms.length || !contentType || !goal || balance < creditCost || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <><Spinner size="sm" /> Generating content...</>
                ) : (
                  <><Sparkles size={16} /> Generate {variationCount} {variationCount === 1 ? 'Variation' : 'Variations'} — {creditCost} {creditCost === 1 ? 'Credit' : 'Credits'}</>
                )}
              </button>
              ) : (
              <button
                onClick={handleGenerateCalendar}
                disabled={!selectedPlatforms.length || !goal || balance < calendarCreditCost || isGeneratingCalendar}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingCalendar ? (
                  <><Spinner size="sm" /> Generating {postsPerWeek * 4} posts for {getMonthLabel(calendarMonth)}...</>
                ) : (
                  <><CalendarDays size={16} /> Generate {postsPerWeek * 4} Posts for {getMonthLabel(calendarMonth)} — {calendarCreditCost} Credits</>
                )}
              </button>
              )}
            </div>
          )}

          {/* EMPTY STATE */}
          {!selectedProfile && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Select a client to get started</h3>
              <p className="text-sm text-muted max-w-sm">Pick a client from the sidebar or create a new one to generate social media content.</p>
            </div>
          )}

          {/* GENERATED RESULTS */}
          {generatedContent && activePlatformTab && genMode === 'single' && (
            <div className="space-y-4">
              {selectedPlatforms.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedPlatforms.map((p) => {
                    const pl = PLATFORMS.find((x) => x.key === p);
                    return (
                      <button
                        key={p}
                        onClick={() => setActivePlatformTab(p)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          activePlatformTab === p
                            ? 'bg-primary text-white'
                            : 'bg-surface2 text-muted hover:text-text'
                        }`}
                      >
                        {pl?.icon} {pl?.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {generatedContent[activePlatformTab]?.variations.map((v: Variation, i: number) => (
                <div key={v.id} className="p-5 rounded-xl border border-border bg-surface space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text">Variation {i + 1}</span>
                        {v.approach && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPROACH_COLORS[v.approach] || 'bg-surface2 text-muted'}`}>
                            {v.approach}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{v.format}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const key = `${activePlatformTab}-${i}`;
                            setPreviewMode((prev) => ({ ...prev, [key]: !prev[key] }));
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted hover:text-primary transition-colors"
                        >
                          {previewMode[`${activePlatformTab}-${i}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                          {previewMode[`${activePlatformTab}-${i}`] ? 'Edit' : 'Preview'}
                        </button>
                        <button
                          onClick={() => regenerateVariation(v.id)}
                          disabled={regeneratingId === `${activePlatformTab}-${v.id}`}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted hover:text-primary transition-colors disabled:opacity-50"
                          title="Regenerate this variation (1 credit)"
                        >
                          <RefreshCw size={12} className={regeneratingId === `${activePlatformTab}-${v.id}` ? 'animate-spin' : ''} />
                          Regenerate
                        </button>
                      </div>
                    </div>

                  <div className="p-4 rounded-lg bg-surface2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted uppercase tracking-wider">Caption</p>
                      <button onClick={() => copyToClipboard(v.caption, `caption-${activePlatformTab}-${i}`)} className="p-1 rounded text-muted hover:text-primary">
                        {copiedField === `caption-${activePlatformTab}-${i}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {previewMode[`${activePlatformTab}-${i}`] ? (
                      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-border max-w-[320px] mx-auto overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {selectedProfile?.business_name?.[0] || 'B'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text">
                              {selectedProfile?.instagram ? `@${selectedProfile.instagram}` : selectedProfile?.business_name}
                            </p>
                            <p className="text-xs text-muted">{selectedProfile?.location || ''}</p>
                          </div>
                        </div>
                        <div className="w-full aspect-square bg-surface2 flex items-center justify-center border-b border-border">
                          <div className="text-center space-y-2 p-4">
                            <ImageIcon size={32} className="text-muted mx-auto" />
                            <p className="text-xs text-muted">{v.image_direction}</p>
                          </div>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-text">
                            {selectedProfile?.instagram ? `@${selectedProfile.instagram}` : selectedProfile?.business_name}
                          </p>
                          <div className="text-xs text-text leading-relaxed">
                            {v.caption.split('\n').map((line: string, j: number) => (
                              line.trim() === ''
                                ? <div key={j} className="h-2" />
                                : <span key={j} className="block">{line}</span>
                            ))}
                          </div>
                          <p className="text-xs text-primary">
                            {formatHashtags(
                              v.hashtag_string ||
                                v.hashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' ')
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {v.caption.split('\n').map((line: string, j: number) => (
                          line.trim() === ''
                            ? <div key={j} className="h-3" />
                            : <p key={j} className="text-sm text-text leading-relaxed">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-surface2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted uppercase tracking-wider">Hashtags</p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            formatHashtags(
                              v.hashtag_string ||
                                v.hashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' ')
                            ),
                            `hashtags-${activePlatformTab}-${i}`
                          )
                        }
                        className="p-1 rounded text-muted hover:text-primary"
                      >
                        {copiedField === `hashtags-${activePlatformTab}-${i}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {(() => {
                      const hashtagArray =
                        (v.hashtags && v.hashtags.length > 0
                          ? v.hashtags
                          : (v.hashtag_string || '')
                              .split(' ')
                              .filter((t: string) => t.startsWith('#'))
                              .map((t: string) => t.replace('#', ''))) || [];
                      const normalized = hashtagArray.map((t: string) => t.replace(/^#/, ''));
                      const copyAll = formatHashtags(
                        v.hashtag_string || normalized.map((t: string) => `#${t}`).join(' ')
                      );

                      return (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {normalized.map((tag: string, j: number) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors"
                              onClick={() => copyToClipboard(`#${tag}`, `hashtag-${activePlatformTab}-${i}-${j}`)}
                              title="Click to copy"
                            >
                              #{tag}
                            </span>
                          ))}
                          <button
                            onClick={() => copyToClipboard(copyAll, `hashtags-all-${activePlatformTab}-${i}`)}
                            className="text-xs px-2 py-1 rounded-full bg-surface text-muted hover:text-text transition-colors"
                          >
                            Copy all
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {v.hook && (
                    <div className="p-4 rounded-lg bg-surface2">
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">Hook</p>
                      <p className="text-sm text-text italic">&ldquo;{v.hook}&rdquo;</p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-surface2">
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Image/Video Direction</p>
                    <p className="text-sm text-text">{v.image_direction}</p>
                    {v.video_direction && <p className="text-sm text-muted mt-1">Video: {v.video_direction}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted">
                    <span>Best time: {v.best_time}</span>
                    <span>CTA: {v.cta}</span>
                    <span>Tip: {v.engagement_tip}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyToClipboard(formatCopyAll(v), `all-${activePlatformTab}-${i}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      {copiedField === `all-${activePlatformTab}-${i}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy All
                    </button>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams({
                          profile_id: selectedProfile?.id || '',
                          platform: activePlatformTab,
                          caption: v.caption,
                          hashtags: v.hashtags.join(','),
                          image_direction: v.image_direction,
                        });
                        router.push(`${basePath}/content/calendar?${params.toString()}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 transition-colors border border-border"
                    >
                      <Calendar className="w-4 h-4" />
                      Add to Calendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={(profile) => {
          loadProfiles();
          setSelectedProfile(profile as unknown as ContentProfile);
        }}
        initialData={editorData}
        leadId={editorLeadId}
      />
    </div>
  );
}
