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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const handleCreateWorkspace = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const res = await fetch('/api/agency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: generatedSlug, brandColor, plan: selectedPlan }),
      });
      if (res.ok) {
        setStep(3);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/agency/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(data.inviteLink);
      }
    } catch { /* silent */ }
    setLoading(false);
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
            <button onClick={handleCreateWorkspace} disabled={loading} className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : 'Create Workspace'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 3: Invite Team */}
        {step === 3 && (
          <div className="bg-surface border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mb-2">Invite Your Team</h2>
            <p className="text-sm text-muted mb-6">Add your first team member or skip for now.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Email Address</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@email.com" className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
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
              <button onClick={handleInvite} disabled={loading || !inviteEmail.trim()} className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Spinner size="sm" /> : 'Send Invite'}
              </button>
              {inviteLink && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
                  Invite link: <span className="font-mono">{inviteLink}</span>
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
