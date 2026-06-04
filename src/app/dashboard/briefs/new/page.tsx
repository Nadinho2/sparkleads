'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Briefcase, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Twitter', label: 'Twitter' },
  { value: 'WhatsApp', label: 'WhatsApp Status' },
];

const GOALS = [
  { value: 'Get Customers', label: '🎯 Get Customers' },
  { value: 'Brand Awareness', label: '📢 Brand Awareness' },
  { value: 'Promote Offer', label: '🏷️ Promote Offer' },
  { value: 'Drive Traffic', label: '🔗 Drive Traffic' },
  { value: 'Get Calls', label: '📞 Get Calls' },
];

const ASSET_OPTIONS = [
  'We have a logo',
  'We have product photos',
  'We have previous ads',
  'We have brand guidelines',
  'We have nothing yet',
];

export default function NewBriefPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Instagram']);
  const [goal, setGoal] = useState('Get Customers');
  const [budget, setBudget] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandColors, setBrandColors] = useState<string[]>(['', '', '']);
  const [existingAssets, setExistingAssets] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [adPlanId, setAdPlanId] = useState('');
  const [leadId, setLeadId] = useState('');

  useEffect(() => {
    // Check for linked ad plan
    const planId = localStorage.getItem('sparkleads_brief_plan');
    if (planId) {
      setAdPlanId(planId);
      // Load ad plan data to prefill
      fetch(`/api/ads/${planId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.plan) {
            const plan = data.plan;
            if (plan.business_name) setBusinessName(plan.business_name);
            if (plan.business_type) setBusinessType(plan.business_type);
            if (plan.location) setLocation(plan.location);
            if (plan.platforms) setPlatforms(plan.platforms);
            if (plan.goal) setGoal(plan.goal);
            if (plan.budget) setBudget(String(plan.budget));
          }
        })
        .catch(() => {})
        .finally(() => localStorage.removeItem('sparkleads_brief_plan'));
    }

    // Check for linked lead
    const leadData = localStorage.getItem('sparkleads_brief_lead');
    if (leadData) {
      try {
        const lead = JSON.parse(leadData);
        if (lead.name) setBusinessName(lead.name);
        if (lead.type) setBusinessType(lead.type);
        if (lead.address) setLocation(lead.address);
        if (lead.id) setLeadId(lead.id);
      } catch { /* ignore */ }
      localStorage.removeItem('sparkleads_brief_lead');
    }
  }, []);

  function togglePlatform(value: string) {
    setPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  function toggleAsset(value: string) {
    setExistingAssets((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  }

  async function handleGenerate() {
    if (!businessName.trim()) { toast.error('Business name is required'); return; }
    if (platforms.length === 0) { toast.error('Select at least one platform'); return; }
    if (!goal) { toast.error('Select a campaign goal'); return; }

    setGenerating(true);
    try {
      const res = await fetch('/api/briefs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          location: location.trim(),
          platforms,
          goal,
          budget: budget ? parseInt(budget) : undefined,
          adPlanId: adPlanId || undefined,
          leadId: leadId || undefined,
          targetAudience: targetAudience.trim() || undefined,
          brandColors: brandColors.filter(Boolean),
          existingAssets: existingAssets.join(', ') || undefined,
          specialInstructions: specialInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to generate');
        }
        return;
      }

      toast.success('Creative brief generated! (5 credits)');
      router.push(`/dashboard/briefs/${data.briefId}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/briefs')}
          className="p-2 rounded-lg bg-surface2 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">New Creative Brief</h1>
          <p className="text-sm text-muted">Generate a complete brief for designers and video editors</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Business Details */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Briefcase size={16} className="text-primary" /> Business Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1.5 block">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Chicken Republic"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Business Type</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. Restaurant"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Victoria Island, Lagos"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Section 2: Campaign Details */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4">
          <h3 className="text-sm font-semibold text-text">Campaign Details</h3>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Platforms *</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => togglePlatform(p.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    platforms.includes(p.value)
                      ? 'bg-primary text-white'
                      : 'bg-surface2 text-text border border-border hover:border-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Campaign Goal *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    goal === g.value
                      ? 'bg-primary text-white'
                      : 'bg-surface2 text-text border border-border hover:border-primary'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Budget (₦) — optional</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Section 3: Brand Details */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4">
          <h3 className="text-sm font-semibold text-text">Brand Details</h3>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Target Audience — optional</label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Young professionals aged 25-35 in Lagos who eat out frequently"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Brand Colors — optional (up to 3)</label>
            <div className="flex gap-2">
              {brandColors.map((color, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  {color && (
                    <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: color }} />
                  )}
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const next = [...brandColors];
                      next[i] = e.target.value;
                      setBrandColors(next);
                    }}
                    placeholder={i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Existing Assets</label>
            <div className="flex flex-wrap gap-2">
              {ASSET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleAsset(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    existingAssets.includes(opt)
                      ? 'bg-primary text-white'
                      : 'bg-surface2 text-text border border-border'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Special Instructions — optional</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific requirements, references, or notes for the creative team..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !businessName.trim() || platforms.length === 0}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating Brief...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Brief — 5 Credits</>
          )}
        </button>
      </div>
    </div>
  );
}
