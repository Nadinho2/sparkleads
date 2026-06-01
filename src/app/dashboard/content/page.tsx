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
} from 'lucide-react';
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
  hook: string;
  caption: string;
  hashtags: string[];
  image_direction: string;
  video_direction: string;
  cta: string;
  best_time: string;
  format: string;
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

export default function ContentPage() {
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
        setEditorData(data.prefilled);
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

  const formatCopyAll = (v: Variation) => {
    return `CAPTION:\n${v.caption}\n\nHASHTAGS:\n${v.hashtags.join(' ')}\n\nIMAGE DIRECTION:\n${v.image_direction}`;
  };

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

          {/* GENERATION FORM */}
          {selectedProfile && (
            <div className="p-5 rounded-xl border border-border bg-surface space-y-5">
              <h3 className="text-base font-semibold text-text">Generate Content</h3>

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
                    <p className="text-sm font-medium text-text">This uses {creditCost} {creditCost === 1 ? 'credit' : 'credits'}</p>
                    <p className="text-xs text-muted">Your balance: {balance} credits</p>
                  </div>
                </div>
                {balance < creditCost && (
                  <a href="/dashboard/credits" className="text-xs text-primary underline">Get more credits</a>
                )}
              </div>

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
          {generatedContent && activePlatformTab && (
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
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{v.format}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-surface2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted uppercase tracking-wider">Caption</p>
                      <button onClick={() => copyToClipboard(v.caption, `caption-${activePlatformTab}-${i}`)} className="p-1 rounded text-muted hover:text-primary">
                        {copiedField === `caption-${activePlatformTab}-${i}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-sm text-text whitespace-pre-wrap">{v.caption}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-surface2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted uppercase tracking-wider">Hashtags</p>
                      <button onClick={() => copyToClipboard(v.hashtags.join(' '), `hashtags-${activePlatformTab}-${i}`)} className="p-1 rounded text-muted hover:text-primary">
                        {copiedField === `hashtags-${activePlatformTab}-${i}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {v.hashtags.map((tag: string, j: number) => (
                        <span key={j} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs">{tag}</span>
                      ))}
                    </div>
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
                        router.push(`/dashboard/content/calendar?${params.toString()}`);
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
