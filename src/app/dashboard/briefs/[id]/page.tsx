'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';

interface BriefData {
  brief_title?: string;
  campaign_overview?: string;
  target_audience_summary?: {
    who?: string; age?: string; gender?: string; mindset?: string; pain_point?: string;
  };
  brand_guidelines?: {
    tone?: string;
    colors?: { primary?: string; secondary?: string; avoid?: string };
    fonts?: string; logo_usage?: string; do?: string[]; dont?: string[];
  };
  deliverables?: Array<{
    id?: string; platform?: string; format?: string; dimensions?: string;
    duration?: string; quantity?: number; priority?: string; deadline_days?: number;
  }>;
  video_scripts?: Array<{
    deliverable_id?: string; title?: string; hook?: string;
    scenes?: Array<{
      scene?: number; duration?: string; visual?: string;
      audio?: string; text_overlay?: string; transition?: string;
    }>;
    cta_scene?: { duration?: string; visual?: string; text?: string; contact?: string };
  }>;
  image_directions?: Array<{
    deliverable_id?: string; title?: string; composition?: string; background?: string;
    subject?: string;
    text_overlay?: { headline?: string; subtext?: string; cta?: string; placement?: string };
    lighting?: string; mood?: string; reference_style?: string;
  }>;
  copy_directions?: {
    headline_options?: string[]; tagline?: string; cta_options?: string[];
    avoid_words?: string[]; key_messages?: string[];
  };
  production_notes?: {
    equipment?: string; location?: string; props?: string[];
    wardrobe?: string; time_of_day?: string; what_to_avoid?: string[];
  };
  approval_process?: {
    draft_deadline?: string; revision_rounds?: number;
    final_deadline?: string; approval_contact?: string;
  };
  inspiration?: {
    references?: string[]; aesthetic?: string; feel?: string;
  };
}

interface BriefRecord {
  id: string;
  business_name: string;
  business_type: string;
  platforms: string[];
  brief_data: BriefData;
  status: string;
  created_at: string;
}

export default function BriefDetailPage({ params }: { params: { id: string } }) {
  const basePath = useBasePath();
  const router = useRouter();
  const [brief, setBrief] = useState<BriefRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBrief = useCallback(async () => {
    try {
      const res = await fetch(`/api/briefs/${params.id}`);
      const data = await res.json();
      if (data.brief) setBrief(data.brief);
    } catch {
      toast.error('Failed to load brief');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  async function updateStatus(status: string) {
    if (!brief) return;
    try {
      await fetch('/api/briefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: brief.id, status }),
      });
      setBrief({ ...brief, status });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Brief not found</p>
        <button onClick={() => router.push(`${basePath}/briefs`)} className="text-primary text-sm mt-2 hover:underline">
          Back to briefs
        </button>
      </div>
    );
  }

  const data = brief.brief_data;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - no print */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`${basePath}/briefs`)}
            className="p-2 rounded-lg bg-surface2 text-muted hover:text-text transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text">{data.brief_title || 'Creative Brief'}</h1>
            <p className="text-sm text-muted">{brief.business_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={brief.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text"
          >
            <option value="draft">Draft</option>
            <option value="shared">Shared</option>
            <option value="in_production">In Production</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => window.print()} className="p-2 rounded-lg bg-surface2 text-muted hover:text-text transition-colors" title="Print / PDF">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold mb-2">Creative Brief</h1>
        <p className="text-lg">{brief.business_name} — {data.brief_title}</p>
        <p className="text-sm text-gray-500">
          Platforms: {brief.platforms.join(', ')} | Generated: {new Date(brief.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-8 print:space-y-6">
        {/* Campaign Overview */}
        {data.campaign_overview && (
          <section className="p-5 rounded-2xl border border-border bg-surface print:rounded print:border-gray-300">
            <h2 className="text-lg font-bold text-text mb-3">Campaign Overview</h2>
            <p className="text-sm text-muted leading-relaxed">{data.campaign_overview}</p>
          </section>
        )}

        {/* Target Audience */}
        {data.target_audience_summary && (
          <section className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-bold text-text mb-3">Target Audience</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.target_audience_summary).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-surface2">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-text font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Brand Guidelines */}
        {data.brand_guidelines && (
          <section className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-bold text-text mb-3">Brand Guidelines</h2>
            <div className="space-y-3">
              {data.brand_guidelines.tone && (
                <div>
                  <p className="text-xs text-muted mb-1">Tone</p>
                  <p className="text-sm text-text">{data.brand_guidelines.tone}</p>
                </div>
              )}
              {data.brand_guidelines.colors && (
                <div>
                  <p className="text-xs text-muted mb-2">Colors</p>
                  <div className="flex gap-3">
                    {data.brand_guidelines.colors.primary && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: data.brand_guidelines.colors.primary }} />
                        <span className="text-xs text-text">Primary: {data.brand_guidelines.colors.primary}</span>
                      </div>
                    )}
                    {data.brand_guidelines.colors.secondary && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: data.brand_guidelines.colors.secondary }} />
                        <span className="text-xs text-text">Secondary: {data.brand_guidelines.colors.secondary}</span>
                      </div>
                    )}
                  </div>
                  {data.brand_guidelines.colors.avoid && (
                    <p className="text-xs text-red-400 mt-1">Avoid: {data.brand_guidelines.colors.avoid}</p>
                  )}
                </div>
              )}
              {data.brand_guidelines.fonts && (
                <div>
                  <p className="text-xs text-muted mb-1">Fonts</p>
                  <p className="text-sm text-text">{data.brand_guidelines.fonts}</p>
                </div>
              )}
              {data.brand_guidelines.logo_usage && (
                <div>
                  <p className="text-xs text-muted mb-1">Logo Usage</p>
                  <p className="text-sm text-text">{data.brand_guidelines.logo_usage}</p>
                </div>
              )}
              {(data.brand_guidelines.do || data.brand_guidelines.dont) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <p className="text-xs font-medium text-green-400 mb-2">DO</p>
                    <ul className="space-y-1">
                      {(data.brand_guidelines.do || []).map((item, i) => (
                        <li key={i} className="text-xs text-text flex items-start gap-1">
                          <span className="text-green-400 mt-0.5">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-xs font-medium text-red-400 mb-2">DON&apos;T</p>
                    <ul className="space-y-1">
                      {(data.brand_guidelines.dont || []).map((item, i) => (
                        <li key={i} className="text-xs text-text flex items-start gap-1">
                          <span className="text-red-400 mt-0.5">✗</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Deliverables Table */}
        {data.deliverables && data.deliverables.length > 0 && (
          <section className="p-5 rounded-2xl border border-border bg-surface overflow-x-auto">
            <h2 className="text-lg font-bold text-text mb-3">Deliverables</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">ID</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Platform</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Format</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Size</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Duration</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Qty</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Priority</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {data.deliverables.map((d, i) => (
                  <tr key={i} className={`border-b border-border/50 ${d.priority === 'High' ? 'bg-primary/5' : ''}`}>
                    <td className="py-2 px-3 font-mono text-xs">{d.id}</td>
                    <td className="py-2 px-3">{d.platform}</td>
                    <td className="py-2 px-3">{d.format}</td>
                    <td className="py-2 px-3 font-mono text-xs">{d.dimensions}</td>
                    <td className="py-2 px-3">{d.duration}</td>
                    <td className="py-2 px-3">{d.quantity}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        d.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                        d.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-surface2 text-muted'
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3">{d.deadline_days}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Video Scripts */}
        {data.video_scripts && data.video_scripts.length > 0 && (
          <section className="p-5 rounded-2xl border border-border bg-surface space-y-6">
            <h2 className="text-lg font-bold text-text">Video Scripts</h2>
            {data.video_scripts.map((script, si) => (
              <div key={si} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text">{script.title}</h3>
                  <span className="text-[10px] text-muted bg-surface2 px-2 py-0.5 rounded-full">
                    Ref: {script.deliverable_id}
                  </span>
                </div>
                {script.hook && (
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-[10px] text-purple-400 font-medium mb-1">HOOK (First 3 seconds)</p>
                    <p className="text-xs text-text">{script.hook}</p>
                  </div>
                )}
                {script.scenes?.map((scene, sci) => (
                  <div key={sci} className="p-3 rounded-lg bg-surface2 border border-border">
                    <p className="text-xs font-semibold text-primary mb-2">
                      Scene {scene.scene} ({scene.duration})
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted">Visual:</span>
                        <p className="text-text mt-0.5">{scene.visual}</p>
                      </div>
                      <div>
                        <span className="text-muted">Audio:</span>
                        <p className="text-text mt-0.5">{scene.audio}</p>
                      </div>
                      {scene.text_overlay && (
                        <div>
                          <span className="text-muted">Text Overlay:</span>
                          <p className="text-text mt-0.5">{scene.text_overlay}</p>
                        </div>
                      )}
                      {scene.transition && (
                        <div>
                          <span className="text-muted">Transition:</span>
                          <p className="text-text mt-0.5">{scene.transition}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {script.cta_scene && (
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <p className="text-[10px] text-green-400 font-medium mb-1">CTA ({script.cta_scene.duration})</p>
                    <p className="text-xs text-text">{script.cta_scene.visual}</p>
                    <p className="text-xs text-text font-medium mt-1">{script.cta_scene.text}</p>
                    {script.cta_scene.contact && (
                      <p className="text-xs text-primary mt-1">{script.cta_scene.contact}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Image Directions */}
        {data.image_directions && data.image_directions.length > 0 && (
          <section className="p-5 rounded-2xl border border-border bg-surface space-y-4">
            <h2 className="text-lg font-bold text-text">Image Directions</h2>
            {data.image_directions.map((img, i) => (
              <div key={i} className="p-4 rounded-lg bg-surface2 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text">{img.title}</h3>
                  <span className="text-[10px] text-muted">Ref: {img.deliverable_id}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted">Composition:</span><p className="text-text">{img.composition}</p></div>
                  <div><span className="text-muted">Background:</span><p className="text-text">{img.background}</p></div>
                  <div><span className="text-muted">Subject:</span><p className="text-text">{img.subject}</p></div>
                  <div><span className="text-muted">Lighting:</span><p className="text-text">{img.lighting}</p></div>
                  <div><span className="text-muted">Mood:</span><p className="text-text">{img.mood}</p></div>
                  <div><span className="text-muted">Reference Style:</span><p className="text-text">{img.reference_style}</p></div>
                </div>
                {img.text_overlay && (
                  <div className="p-2 rounded bg-surface border border-border text-xs">
                    <span className="text-muted">Text Overlay:</span>
                    <p className="text-text font-medium">{img.text_overlay.headline}</p>
                    <p className="text-muted">{img.text_overlay.subtext}</p>
                    <p className="text-primary">{img.text_overlay.cta} — {img.text_overlay.placement}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Copy Directions */}
        {data.copy_directions && (
          <section className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-bold text-text mb-3">Copy Directions</h2>
            <div className="space-y-3">
              {data.copy_directions.headline_options && (
                <div>
                  <p className="text-xs text-muted mb-1">Headline Options</p>
                  <div className="flex flex-wrap gap-2">
                    {data.copy_directions.headline_options.map((h, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-surface2 text-xs text-text border border-border">{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.copy_directions.tagline && (
                <div>
                  <p className="text-xs text-muted mb-1">Tagline</p>
                  <p className="text-sm text-text font-medium italic">&ldquo;{data.copy_directions.tagline}&rdquo;</p>
                </div>
              )}
              {data.copy_directions.cta_options && (
                <div>
                  <p className="text-xs text-muted mb-1">CTA Options</p>
                  <div className="flex flex-wrap gap-2">
                    {data.copy_directions.cta_options.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 text-xs text-primary font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.copy_directions.avoid_words && (
                <div>
                  <p className="text-xs text-muted mb-1">Words to Avoid</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.copy_directions.avoid_words.map((w, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-red-500/10 text-xs text-red-400">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.copy_directions.key_messages && (
                <div>
                  <p className="text-xs text-muted mb-1">Key Messages</p>
                  <ul className="space-y-1">
                    {data.copy_directions.key_messages.map((m, i) => (
                      <li key={i} className="text-xs text-text flex items-start gap-1">
                        <span className="text-primary">•</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Production Notes */}
        {data.production_notes && (
          <section className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-bold text-text mb-3">Production Notes</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.production_notes.equipment && (
                <div className="p-3 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1">Equipment</p>
                  <p className="text-sm text-text">{data.production_notes.equipment}</p>
                </div>
              )}
              {data.production_notes.location && (
                <div className="p-3 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1">Location</p>
                  <p className="text-sm text-text">{data.production_notes.location}</p>
                </div>
              )}
              {data.production_notes.wardrobe && (
                <div className="p-3 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1">Wardrobe</p>
                  <p className="text-sm text-text">{data.production_notes.wardrobe}</p>
                </div>
              )}
              {data.production_notes.time_of_day && (
                <div className="p-3 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1">Best Time to Shoot</p>
                  <p className="text-sm text-text">{data.production_notes.time_of_day}</p>
                </div>
              )}
            </div>
            {data.production_notes.props && data.production_notes.props.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted mb-1">Props Needed</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.production_notes.props.map((p, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-surface2 text-xs text-text border border-border">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {data.production_notes.what_to_avoid && data.production_notes.what_to_avoid.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted mb-1">What to Avoid</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.production_notes.what_to_avoid.map((a, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-red-500/10 text-xs text-red-400">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Approval Timeline */}
        {data.approval_process && (
          <section className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-bold text-text mb-3">Approval Timeline</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">Brief</span>
              <span className="text-muted">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                Draft ({data.approval_process.draft_deadline})
              </span>
              <span className="text-muted">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium">
                Revision ×{data.approval_process.revision_rounds}
              </span>
              <span className="text-muted">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium">
                Final ({data.approval_process.final_deadline})
              </span>
            </div>
          </section>
        )}

        {/* Inspiration */}
        {data.inspiration && (
          <section className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-bold text-text mb-3">Inspiration</h2>
            {data.inspiration.aesthetic && (
              <div className="mb-2">
                <p className="text-xs text-muted mb-1">Aesthetic</p>
                <p className="text-sm text-text">{data.inspiration.aesthetic}</p>
              </div>
            )}
            {data.inspiration.feel && (
              <div className="mb-2">
                <p className="text-xs text-muted mb-1">How viewers should feel</p>
                <p className="text-sm text-text">{data.inspiration.feel}</p>
              </div>
            )}
            {data.inspiration.references && (
              <div>
                <p className="text-xs text-muted mb-1">Reference Styles</p>
                <ul className="space-y-1">
                  {data.inspiration.references.map((r, i) => (
                    <li key={i} className="text-xs text-text flex items-start gap-1">
                      <span className="text-primary">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
