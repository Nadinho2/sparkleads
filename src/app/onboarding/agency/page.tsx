'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 49, seats: 3, credits: 500, desc: 'Solo to small team' },
  { id: 'growth', name: 'Growth', price: 99, seats: 8, credits: 2000, desc: 'Growing agencies' },
  { id: 'pro', name: 'Pro', price: 199, seats: 'Unlimited', credits: 10000, desc: 'Established agencies' },
];

export default function AgencyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#3B82F6');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCreditLimit, setInviteCreditLimit] = useState(0);
  const [error, setError] = useState('');

  const handleCreateWorkspace = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const res = await fetch('/api/agency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: generatedSlug, brandColor, plan: selectedPlan }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(3);
      } else {
        setError(data.message || data.error || 'Failed to create workspace');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agency/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole, creditLimit: inviteCreditLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(data.inviteLink);
      } else {
        setError(data.message || data.error || 'Failed to generate invite');
      }
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
      } catch { /* */ }
    }
  };

  const goToDashboard = () => {
    router.push('/agency');
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s ? 'bg-green-500 text-white' : step === s ? 'bg-primary text-white' : 'bg-surface2 text-muted'
              }`}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Agency Details */}
        {step === 1 && (
          <div className="bg-surface border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mb-2">Agency Details</h2>
            <p className="text-sm text-muted mb-6">Set up your agency profile.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Agency / Company Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UltimaSpark Agency" className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">URL Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder={name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'your-agency'} className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <span className="text-sm text-muted font-mono">{brandColor}</span>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!name.trim()} className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <div className="bg-surface border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mb-2">Choose Your Plan</h2>
            <p className="text-sm text-muted mb-6">Select the plan that fits your agency.</p>
            <div className="grid gap-4 mb-6">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`text-left p-5 rounded-xl border transition-all ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface2 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-text">{plan.name}</h3>
                    <span className="text-xl font-bold text-primary">${plan.price}<span className="text-sm text-muted">/mo</span></span>
                  </div>
                  <p className="text-xs text-muted mb-2">{plan.desc}</p>
                  <div className="flex gap-4 text-xs text-muted">
                    <span>{plan.seats} seats</span>
                    <span>{plan.credits.toLocaleString()} credits/mo</span>
                  </div>
                </button>
              ))}
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                {error}
              </div>
            )}
            <button onClick={handleCreateWorkspace} disabled={loading} className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : 'Create Workspace'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 3: Invite Team */}
        {step === 3 && (
          <div className="bg-surface border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mb-2">Invite Your Team</h2>
            <p className="text-sm text-muted mb-6">Generate a shareable invite link and send it via WhatsApp or any messaging app.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Role</label>
                <div className="flex gap-3">
                  {['manager', 'member'].map((r) => (
                    <button key={r} onClick={() => setInviteRole(r)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${inviteRole === r ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface2 text-muted hover:border-primary/50'}`}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Monthly Credit Limit (0 = no limit)</label>
                <input type="number" value={inviteCreditLimit} onChange={(e) => setInviteCreditLimit(Number(e.target.value))} min="0" placeholder="0" className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button onClick={handleGenerateInvite} disabled={loading} className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Spinner size="sm" /> : 'Generate Invite Link'}
              </button>
              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>
              )}
              {inviteLink && (
                <div className="space-y-3 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                  <p className="text-sm font-semibold text-green-400">✅ Invite link ready</p>
                  <div className="flex items-center gap-2 bg-surface rounded-lg p-3 border border-border">
                    <code className="text-xs text-muted flex-1 truncate">{inviteLink}</code>
                    <button onClick={copyInviteLink} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium">Copy</button>
                  </div>
                  <p className="text-xs text-muted">Share this link with your team member. It expires in 30 days.</p>
                </div>
              )}
              <button onClick={goToDashboard} className="w-full py-3 rounded-xl border border-border text-muted text-sm font-medium hover:text-text hover:border-primary/50 transition-colors">
                Skip for now → Go to Agency Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
