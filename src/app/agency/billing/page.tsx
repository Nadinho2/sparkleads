'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';
import { Zap, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  plan: string;
  monthly_credits: number;
  credits_remaining: number;
  seats_limit: number;
  status: string;
}

const PLAN_DETAILS: Record<string, { name: string; price: number; credits: number; seats: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: 49,
    credits: 500,
    seats: '3',
    features: ['500 monthly credits', '3 team members', 'All services included', 'Email support'],
  },
  growth: {
    name: 'Growth',
    price: 99,
    credits: 2000,
    seats: '8',
    features: ['2,000 monthly credits', '8 team members', 'All services included', 'Priority support', 'Analytics dashboard'],
  },
  pro: {
    name: 'Pro',
    price: 199,
    credits: 10000,
    seats: 'Unlimited',
    features: ['10,000 monthly credits', 'Unlimited team members', 'All services included', 'Dedicated support', 'Advanced analytics', 'Custom branding'],
  },
};

const CREDIT_PACKS = [
  { credits: 50, price: 9.99, label: '50 Credits' },
  { credits: 200, price: 29.99, label: '200 Credits' },
  { credits: 500, price: 59.99, label: '500 Credits' },
];

export default function BillingPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data.workspace);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleBuyCredits(pack: typeof CREDIT_PACKS[number]) {
    setPurchasing(pack.label);
    try {
      const res = await fetch('/api/agency/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: pack.credits, amount: pack.price }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setPurchasing(null);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const plan = PLAN_DETAILS[workspace?.plan || 'starter'] || PLAN_DETAILS.starter;
  const creditsUsed = (workspace?.monthly_credits || 0) - (workspace?.credits_remaining || 0);
  const usagePercent = workspace?.monthly_credits ? Math.round((creditsUsed / workspace.monthly_credits) * 100) : 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text mb-1">Billing & Credits</h1>
        <p className="text-sm text-muted">Manage your subscription and purchase additional credits.</p>
      </div>

      {/* Current Plan */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Current Plan
          </h2>
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium capitalize">
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
            <p className="text-lg font-bold text-text">${plan.price}/mo</p>
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
              <Check className="w-4 h-4 text-green-400" />
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
              usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-primary'
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
        <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Buy Extra Credits
        </h2>
        <p className="text-sm text-muted mb-4">Need more credits this month? Purchase a credit pack instantly.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.label}
              onClick={() => handleBuyCredits(pack)}
              disabled={purchasing === pack.label}
              className="p-4 rounded-xl border border-border bg-surface2 hover:border-primary/50 hover:bg-primary/5 transition-all text-center disabled:opacity-50"
            >
              <p className="text-2xl font-bold text-text">{pack.credits}</p>
              <p className="text-xs text-muted mb-2">credits</p>
              <p className="text-lg font-semibold text-primary">${pack.price}</p>
              <p className="text-xs text-muted mt-1">one-time</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-3 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Payments processed securely by Paystack
        </p>
      </div>

      {/* Plan Comparison */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-4">All Plans</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {Object.entries(PLAN_DETAILS).map(([key, p]) => (
            <div
              key={key}
              className={`p-4 rounded-xl border ${
                key === workspace?.plan
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface2'
              }`}
            >
              {key === workspace?.plan && (
                <span className="text-[10px] font-bold text-primary uppercase">Current</span>
              )}
              <h3 className="text-lg font-bold text-text">{p.name}</h3>
              <p className="text-2xl font-bold text-text mt-1">${p.price}<span className="text-sm font-normal text-muted">/mo</span></p>
              <p className="text-xs text-muted mt-1">{p.credits.toLocaleString()} credits · {p.seats} seats</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
