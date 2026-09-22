'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';
import { Zap, Shield, Check, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  plan: string;
  monthly_credits: number;
  credits_remaining: number;
  seats_limit: number;
  status: string;
}

const PLAN_DETAILS: Record<string, { id: string; name: string; price: string; credits: number; seats: string; features: string[] }> = {
  starter: {
    id: 'solo',
    name: 'Solo / Starter',
    price: '$19',
    credits: 300,
    seats: '1',
    features: ['300 monthly credits', '1 team seat', 'All search & audit tools included', 'Standard email support'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: '$59',
    credits: 2000,
    seats: '5',
    features: ['2,000 monthly credits', '5 team seats', 'Automated email sequences', 'Priority support', 'Client management CRM'],
  },
  pro: {
    id: 'agency',
    name: 'Agency / Scale',
    price: '$199',
    credits: 10000,
    seats: 'Unlimited',
    features: ['10,000 monthly credits', 'Unlimited team members', 'Custom white-label branding', 'Dedicated support', 'Multi-client workspaces'],
  },
};

const CREDIT_PACKS = [
  { id: 'booster', credits: 250, price: 9.99, label: '250 Credits', popular: false },
  { id: 'growth', credits: 1000, price: 25.00, label: '1,000 Credits', popular: true },
  { id: 'power', credits: 3000, price: 60.00, label: '3,000 Credits', popular: false },
  { id: 'agency_mega', credits: 10000, price: 150.00, label: '10,000 Credits', popular: false },
];

export default function BillingPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data.workspace);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check payment return params
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      const added = params.get('credits');
      toast.success(added ? `Successfully added ${added} credits!` : 'Payment completed successfully!');
      window.history.replaceState({}, '', '/agency/billing');
    }
  }, []);

  async function handleBuyCredits(pack: typeof CREDIT_PACKS[number]) {
    setPurchasing(pack.label);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          workspaceId: workspace?.id,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || data.error || 'Failed to initialize payment');
      }
    } catch {
      toast.error('Something went wrong initiating payment');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleUpgradePlan(targetPlanKey: string) {
    setUpgradingPlan(targetPlanKey);
    const targetPlan = PLAN_DETAILS[targetPlanKey];
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan.id,
          workspaceId: workspace?.id,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || data.error || 'Failed to initiate plan upgrade');
      }
    } catch {
      toast.error('Something went wrong upgrading plan');
    } finally {
      setUpgradingPlan(null);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const plan = PLAN_DETAILS[workspace?.plan || 'starter'] || PLAN_DETAILS.starter;
  const creditsUsed = Math.max(0, (workspace?.monthly_credits || 0) - (workspace?.credits_remaining || 0));
  const usagePercent = workspace?.monthly_credits ? Math.min(100, Math.round((creditsUsed / workspace.monthly_credits) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text mb-1">Billing & Credits</h1>
        <p className="text-sm text-muted">Manage your subscription, team seats, and purchase additional credits.</p>
      </div>

      {/* Current Plan */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Current Plan
          </h2>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium capitalize">
            {workspace?.status || 'active'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted">Plan</p>
            <p className="text-lg font-bold text-text">{plan.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Monthly Price</p>
            <p className="text-lg font-semibold text-text">{plan.price}/mo</p>
          </div>
          <div>
            <p className="text-xs text-muted">Team Seats</p>
            <p className="text-lg font-bold text-text">{plan.seats}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Monthly Credits</p>
            <p className="text-lg font-bold text-text">{plan.credits.toLocaleString()}</p>
          </div>
        </div>
        <ul className="space-y-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted">
              <Check className="w-4 h-4 text-emerald-400" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Usage Bar */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-4">Usage This Month</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">Credits Used</span>
          <span className="text-sm font-medium text-text">
            {creditsUsed.toLocaleString()} / {(workspace?.monthly_credits || 0).toLocaleString()}
          </span>
        </div>
        <div className="w-full h-4 rounded-full bg-surface2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, usagePercent)}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {(workspace?.credits_remaining || 0).toLocaleString()} credits remaining this cycle
        </p>
      </div>

      {/* Buy Extra Credits */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Buy Extra Credit Packs
          </h2>
          <span className="text-xs text-muted">Never expire &bull; Instant activation</span>
        </div>
        <p className="text-sm text-muted mb-4">Need more outreach or audit credits this month? Top up instantly.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.label}
              onClick={() => handleBuyCredits(pack)}
              disabled={purchasing === pack.label}
              className={`p-4 rounded-xl border transition-all text-center relative disabled:opacity-50 ${
                pack.popular
                  ? 'border-primary bg-primary/5 hover:bg-primary/10 shadow-sm'
                  : 'border-border bg-surface2 hover:border-primary/40'
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white uppercase">
                  Best Value
                </span>
              )}
              <p className="text-2xl font-bold text-text">{pack.credits.toLocaleString()}</p>
              <p className="text-xs text-muted mb-2">credits</p>
              <p className="text-lg font-bold text-primary">${pack.price.toFixed(2)}</p>
              <p className="text-[11px] text-muted mt-1">one-time payment</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-4 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Secured with 256-bit encryption. Supports Apple Pay, Google Pay, and major credit cards.
        </p>
      </div>

      {/* Plan Comparison & Upgrade */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-4">Workspace Plans</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {Object.entries(PLAN_DETAILS).map(([key, p]) => {
            const isCurrent = key === workspace?.plan || (key === 'starter' && !workspace?.plan);
            return (
              <div
                key={key}
                className={`p-5 rounded-xl border flex flex-col justify-between ${
                  isCurrent
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-surface2'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-text">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-text">
                    {p.price}<span className="text-xs font-normal text-muted">/mo</span>
                  </p>
                  <p className="text-xs text-muted mt-1 mb-4">
                    {p.credits.toLocaleString()} credits &bull; {p.seats} seats
                  </p>
                  <ul className="space-y-1.5 border-t border-border pt-3 mb-4 text-xs text-muted">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleUpgradePlan(key)}
                    disabled={upgradingPlan === key}
                    className="w-full py-2.5 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {upgradingPlan === key ? <Spinner size="sm" /> : <>Upgrade to {p.name} <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
