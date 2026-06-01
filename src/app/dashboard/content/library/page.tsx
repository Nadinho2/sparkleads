'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  BookOpen,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

interface Variation {
  id: number;
  hook: string;
  caption: string;
  hashtags: string[];
  image_direction: string;
  cta: string;
  best_time: string;
  format: string;
}

interface ContentItem {
  id: string;
  profile_id: string;
  platform: string;
  content_type: string;
  goal: string;
  variations: { platforms: Record<string, { variations: Variation[] }> };
  status: string;
  created_at: string;
  profile: { business_name: string; business_type: string } | null;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '👥',
  tiktok: '🎵',
  twitter: '🐦',
  linkedin: '💼',
  whatsapp: '💬',
};

export default function ContentLibraryPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (platformFilter) params.set('platform', platformFilter);
      if (typeFilter) params.set('content_type', typeFilter);

      const res = await fetch(`/api/content/list?${params.toString()}`);
      const data = await res.json();
      setContent(data.content || []);
    } catch {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [platformFilter, typeFilter]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Content Library</h1>
          <p className="text-sm text-muted mt-1">All your generated content in one place.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-lg border bg-surface px-3 py-2 text-sm text-text border-border focus:outline-none"
          >
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border bg-surface px-3 py-2 text-sm text-text border-border focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="Promotional">Promotional</option>
            <option value="Educational">Educational</option>
            <option value="Engagement">Engagement</option>
            <option value="Behind the Scenes">Behind the Scenes</option>
          </select>
        </div>
      </div>

      {content.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No content yet</h3>
          <p className="text-sm text-muted max-w-sm">Generate your first batch of content to see it here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => {
            const platforms = item.platform.split(',');
            const firstPlatform = platforms[0] || 'instagram';
            const firstVariation = item.variations?.platforms?.[firstPlatform]?.variations?.[0];

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border bg-surface hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {platforms.map((p) => (
                      <span key={p} className="text-sm">{PLATFORM_ICONS[p.trim()] || '📱'}</span>
                    ))}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    item.status === 'used' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'saved' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-muted/20 text-muted'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-text mb-1">{item.profile?.business_name || 'Unknown'}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-surface2 text-xs text-muted mb-2">{item.content_type}</span>
                <p className="text-xs text-muted line-clamp-2">{firstVariation?.caption || 'No caption'}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(firstVariation?.hashtags || []).slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="text-xs text-purple-400">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">{selectedItem.profile?.business_name} — {selectedItem.content_type}</h2>
              <button onClick={() => setSelectedItem(null)} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2"><X className="w-5 h-5" /></button>
            </div>
            {selectedItem.platform.split(',').map((platform) => {
              const pKey = platform.trim();
              const variations = selectedItem.variations?.platforms?.[pKey]?.variations || [];
              return (
                <div key={pKey} className="mb-6">
                  <h3 className="text-sm font-semibold text-text mb-3">{PLATFORM_ICONS[pKey]} {pKey}</h3>
                  <div className="space-y-3">
                    {variations.map((v: Variation, i: number) => (
                      <div key={v.id} className="p-4 rounded-lg bg-surface2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text">Variation {i + 1} — {v.format}</span>
                          <button onClick={() => copyToClipboard(`CAPTION:\n${v.caption}\n\nHASHTAGS:\n${v.hashtags.join(' ')}`, `${selectedItem.id}-${pKey}-${i}`)} className="p-1 rounded text-muted hover:text-primary">
                            {copiedField === `${selectedItem.id}-${pKey}-${i}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-sm text-text whitespace-pre-wrap">{v.caption}</p>
                        <div className="flex flex-wrap gap-1">
                          {v.hashtags.map((tag: string, j: number) => <span key={j} className="text-xs text-purple-400">{tag}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
