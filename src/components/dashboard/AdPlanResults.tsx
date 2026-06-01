'use client';

import { useState } from 'react';
import {
  Target,
  Users,
  Globe,
  DollarSign,
  MessageSquare,
  Hash,
  Palette,
  TrendingUp,
  Lightbulb,
  Copy,
  Check,
  Printer,
  RefreshCw,
  MapPin,
  Calendar,
  Eye,
  BarChart3,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdPlan } from '@/lib/ad-plan-generator';

interface AdPlanResultsProps {
  plan: AdPlan;
  businessName: string;
  budget: number;
  currency: string;
  onRegenerate?: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  KES: 'KSh',
  GHS: 'GH₵',
};

const PLATFORM_COLORS: Record<string, string> = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  TikTok: '#010101',
  Google: '#4285F4',
  WhatsApp: '#25D366',
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label || 'Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface2 transition-colors flex-shrink-0"
      title={label || 'Copy'}
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: React.ComponentType<{ className?: string }>; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color || 'bg-primary/10'}`}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
    </div>
  );
}

export function AdPlanResults({ plan, businessName, budget, currency, onRegenerate }: AdPlanResultsProps) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  const [activeTab, setActiveTab] = useState(0);

  const handlePrint = () => {
    window.print();
  };

  const getBudgetSplit = (): { platform: string; amount: number; percentage: number }[] => {
    if (plan.budget?.split?.length > 0) {
      return plan.budget.split as { platform: string; amount: number; percentage: number }[];
    }

    const recommended = plan.platforms?.filter((p) => p.recommended) || [];
    return recommended.map((p) => ({
      platform: p.name,
      amount: Math.round((plan.budget?.total || 0) * (p.budget_percentage / 100)),
      percentage: p.budget_percentage,
    }));
  };

  const budgetSplit = getBudgetSplit();

  return (
    <div className="space-y-6">
      {plan.market_context && (
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-primary" />
            <h3 className="font-semibold text-text">Market Intelligence</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary ml-auto">
              {plan.market_context.country_or_region}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {[
              {
                label: 'Market Stage',
                value: plan.market_context.market_maturity,
                color:
                  ({
                    Emerging: 'text-orange-400',
                    Developing: 'text-yellow-400',
                    Mature: 'text-green-400',
                  } as Record<string, string>)[plan.market_context.market_maturity] || 'text-text',
              },
              {
                label: 'Primary Discovery',
                value: plan.market_context.primary_discovery_channel,
                color: 'text-text',
              },
              {
                label: 'Budget Power',
                value: plan.market_context.budget_power,
                color: 'text-text',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-surface2 p-3">
                <p className="text-xs text-muted mb-1">{item.label}</p>
                <p className={`text-sm font-medium ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {plan.market_context.cultural_note && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-400 font-medium mb-1">Cultural Insight</p>
              <p className="text-sm text-text">{plan.market_context.cultural_note}</p>
            </div>
          )}

          {plan.market_context.peak_seasons?.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <p className="text-xs text-muted">Peak seasons:</p>
              <div className="flex flex-wrap gap-1">
                {plan.market_context.peak_seasons.map((season: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400"
                  >
                    {season}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1 — HEADER CARD */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text">{businessName}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/20 text-primary">
                Ad Strategy
              </span>
              <span className="text-sm text-muted">{sym}{budget.toLocaleString()}/mo</span>
            </div>
            <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Strategy generated by AI &middot; 5 credits used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 transition-colors border border-border"
            >
              <Printer className="w-4 h-4" />
              Save as PDF
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2 — STRATEGY SUMMARY */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <SectionHeader icon={Target} title="Strategy Summary" />
        <p className="text-sm text-muted leading-relaxed">{plan.executive_summary}</p>
      </div>

      {/* SECTION 3 — TARGET AUDIENCE */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <SectionHeader icon={Users} title="Target Audience" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-surface2">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted">Age</span>
            </div>
            <p className="text-sm font-semibold text-text">{plan.audience.primary.age_range}</p>
            <p className="text-xs text-muted">{plan.audience.primary.age_reasoning}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface2">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted">Gender</span>
            </div>
            <p className="text-sm font-semibold text-text">{plan.audience.primary.gender}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted">Location</span>
            </div>
            <p className="text-sm font-semibold text-text truncate">{plan.audience.primary.location_targeting}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted">Income</span>
            </div>
            <p className="text-sm font-semibold text-text">{plan.audience.primary.income_level}</p>
            <p className="text-xs text-muted">{plan.audience.primary.income_reasoning}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted italic">{plan.audience.primary.gender_reasoning}</p>
          <p className="text-xs text-muted">{plan.audience.primary.psychographics}</p>
          <p className="text-xs text-muted">{plan.audience.primary.description}</p>
        </div>
      </div>

      {/* SECTION 4 — INTERESTS & BEHAVIORS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-surface">
          <SectionHeader icon={Target} title="Interests" />
          <div className="space-y-3">
            {plan.audience.interests.map((interest, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface2">
                <p className="text-sm font-semibold text-text mb-1">{interest.interest}</p>
                <p className="text-xs text-muted mb-2">{interest.relevance}</p>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-surface text-xs text-muted border border-border">
                  {interest.platform_availability}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface">
          <SectionHeader icon={Users} title="Behaviors" />
          <div className="flex flex-wrap gap-2">
            {plan.audience.behaviors.map((behavior, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-surface2 text-text text-sm border border-border"
              >
                {behavior.behavior}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5 — PLATFORM RECOMMENDATIONS */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <SectionHeader icon={Globe} title="Platform Recommendations" />
        <div className="grid sm:grid-cols-2 gap-4">
          {plan.platforms.map((platform, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-colors ${
                platform.recommended
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-surface2 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: PLATFORM_COLORS[platform.name] || '#666' }}
                  >
                    {platform.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{platform.name}</p>
                    <p className="text-xs text-muted">Priority #{platform.priority}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    platform.recommended
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-muted/20 text-muted'
                  }`}
                >
                  {platform.recommended ? 'Recommended' : 'Optional'}
                </span>
              </div>
              <p className="text-xs text-muted mb-3">{platform.why}</p>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-surface text-xs text-muted border border-border">
                  {platform.objective}
                </span>
                {platform.recommended && (
                  <span className="text-lg font-bold text-primary">{platform.budget_percentage}%</span>
                )}
              </div>
              {(platform.best_days || platform.best_hours) && (
                <p className="text-xs text-muted mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {platform.best_days}{platform.best_hours ? ` · ${platform.best_hours}` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6 — BUDGET BREAKDOWN */}
      <div className="p-6 rounded-xl border-2 border-primary/30 bg-surface">
        <SectionHeader icon={DollarSign} title="Budget Breakdown" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-surface2 text-center">
            <p className="text-2xl font-bold text-text">{sym}{plan.budget.total.toLocaleString()}</p>
            <p className="text-xs text-muted mt-1">Total Budget</p>
          </div>
          <div className="p-4 rounded-lg bg-surface2 text-center">
            <p className="text-2xl font-bold text-text">{sym}{plan.budget.daily.toLocaleString()}</p>
            <p className="text-xs text-muted mt-1">Daily Budget</p>
          </div>
          <div className="p-4 rounded-lg bg-surface2 text-center">
            <p className="text-2xl font-bold text-text">{plan.budget.duration_days}</p>
            <p className="text-xs text-muted mt-1">Days</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted">Est. Reach</p>
            <p className="text-sm font-semibold text-text">{plan.budget.estimated_reach}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted">Est. Results</p>
            <p className="text-sm font-semibold text-text">{plan.budget.estimated_results}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted">Cost Per Result</p>
            <p className="text-sm font-semibold text-text">{plan.budget.estimated_cpr}</p>
          </div>
        </div>

        {budgetSplit.length > 0 && (
          <div className="pt-4 border-t border-border mt-4">
            <p className="text-sm font-medium text-text mb-3">Budget Split by Platform</p>
            <div className="space-y-3">
              {budgetSplit.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text font-medium">{item.platform}</span>
                    <span className="text-muted">{sym}{item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: PLATFORM_COLORS[item.platform] || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7 — AD COPIES */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <SectionHeader icon={MessageSquare} title="Ad Copy Templates" />
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
          {plan.ad_copies.map((copy, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === i
                  ? 'bg-primary text-white'
                  : 'bg-surface2 text-muted hover:text-text'
              }`}
            >
              {copy.approach || `${copy.platform} — ${copy.format}`}
            </button>
          ))}
        </div>

        {plan.ad_copies[activeTab] && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-surface2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted mb-1 uppercase tracking-wider">Headline</p>
                <p className="text-sm font-semibold text-text">{plan.ad_copies[activeTab].headline}</p>
              </div>
              <CopyButton text={plan.ad_copies[activeTab].headline} label="Headline copied" />
            </div>

            <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-surface2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted mb-1 uppercase tracking-wider">Approach</p>
                <p className="text-sm text-text">{plan.ad_copies[activeTab].approach}</p>
              </div>
              <CopyButton text={plan.ad_copies[activeTab].approach} label="Approach copied" />
            </div>

            <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-surface2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted mb-1 uppercase tracking-wider">Body Text</p>
                <p className="text-sm text-text">{plan.ad_copies[activeTab].primary_text}</p>
              </div>
              <CopyButton text={plan.ad_copies[activeTab].primary_text} label="Body copied" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-surface2">
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted uppercase tracking-wider">CTA</p>
                <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-medium">
                  {plan.ad_copies[activeTab].cta_button}
                </span>
              </div>
              <CopyButton text={plan.ad_copies[activeTab].cta_button} label="CTA copied" />
            </div>

            {(plan.ad_copies[activeTab].cultural_angle || plan.ad_copies[activeTab].local_language_tip) && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1 uppercase tracking-wider">Cultural Angle</p>
                  <p className="text-sm text-text">{plan.ad_copies[activeTab].cultural_angle}</p>
                </div>
                <div className="p-4 rounded-lg bg-surface2">
                  <p className="text-xs text-muted mb-1 uppercase tracking-wider">Language Tip</p>
                  <p className="text-sm text-text">{plan.ad_copies[activeTab].local_language_tip}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const copy = plan.ad_copies[activeTab];
                const text = [
                  copy.headline,
                  `\n${copy.primary_text}`,
                  `\nCTA: ${copy.cta_button}`,
                ].join('');
                navigator.clipboard.writeText(text);
                toast.success('Full ad copy copied');
              }}
              className="w-full py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Copy Full Ad Copy
            </button>
          </div>
        )}
      </div>

      {/* SECTION 8 — KEYWORDS & HASHTAGS */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <SectionHeader icon={Hash} title="Keywords & Hashtags" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text">Google Primary Keywords</p>
              <CopyButton text={plan.keywords.google_primary.join('\n')} label="Keywords copied" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {plan.keywords.google_primary.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                  {kw}
                </span>
              ))}
            </div>
            {plan.keywords.google_longtail?.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-text">Google Longtail Keywords</p>
                  <CopyButton text={plan.keywords.google_longtail.join('\n')} label="Longtail copied" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.keywords.google_longtail.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-surface2 text-text text-xs border border-border">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text">Social Hashtags</p>
              <CopyButton text={plan.keywords.social_hashtags.join(' ')} label="Hashtags copied" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {plan.keywords.social_hashtags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {plan.keywords.negative?.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-text mb-3">Negative Keywords (Exclude)</p>
            <div className="flex flex-wrap gap-1.5">
              {plan.keywords.negative.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs border border-red-500/20 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 9 — CREATIVE DIRECTION */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <SectionHeader icon={Palette} title="Creative Direction" />
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-text mb-2">Visual Style</p>
            <p className="text-sm text-muted">{plan.creative_brief.visual_direction}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-text mb-2">Color Psychology</p>
            <p className="text-sm text-muted">{plan.creative_brief.color_psychology}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-text mb-3">Content Ideas</p>
            <div className="space-y-2">
              {plan.creative_brief.content_ideas.map((idea, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-text">{idea.type}: {idea.concept}</p>
                    <p className="text-xs text-muted mt-1">{idea.why_it_works}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm font-medium text-green-400 mb-3">Do&rsquo;s</p>
              <ul className="space-y-2">
                {plan.creative_brief.do.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-sm font-medium text-red-400 mb-3">Don&rsquo;ts</p>
              <ul className="space-y-2">
                {plan.creative_brief.dont.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {plan.local_strategy && (
        <div className="rounded-xl bg-surface border border-border p-6">
          <SectionHeader icon={MapPin} title="Local Market Strategy" />
          <div className="space-y-3">
            {[
              { label: 'Building Trust', value: plan.local_strategy.trust_building, icon: '🤝' },
              { label: 'Preferred Payment', value: plan.local_strategy.payment_methods, icon: '💳' },
              { label: 'Best Contact Method', value: plan.local_strategy.communication_channel, icon: '📱' },
              { label: 'Seasonal Opportunity', value: plan.local_strategy.seasonal_opportunities, icon: '📅' },
              { label: 'Competitive Edge', value: plan.local_strategy.competitive_advantage, icon: '⚡' },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label} className="rounded-lg bg-surface2 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{item.icon}</span>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">{item.label}</p>
                  </div>
                  <p className="text-sm text-text">{item.value}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SECTION 10 — KPIs & QUICK WINS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-surface">
          <SectionHeader icon={TrendingUp} title="Key Performance Indicators" />
          <div className="space-y-3">
            {plan.kpis.map((kpi, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-text">{kpi.metric}</span>
                  <span className="text-sm font-semibold text-primary">{kpi.target}</span>
                </div>
                {kpi.how_to_track && <p className="text-xs text-muted mt-1">{kpi.how_to_track}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface">
          <SectionHeader icon={Lightbulb} title="Quick Wins" />
          <div className="space-y-3">
            {plan.quick_wins.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-muted">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
