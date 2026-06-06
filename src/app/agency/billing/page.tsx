'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';

interface Workspace {
  plan: string;
  monthly_credits: number;
  credits_remaining: number;
  seats_limit: number;
  status: string;
}

export default function BillingPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [credits, setCredits] = useState({ total: 0, used: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/account/context').then((r) => r.json()).catch(() => ({})),
      fetch('/api/agency/credits').then((r) => r.json()).catch(() => ({})),
    ]).then(([ctx, cred]) => {
      setWorkspace(ctx.workspace);
      setCredits(cred);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const planNames: Record<string, { name: string; price: number }> = {
    starter: { name: 'Starter', price: 49 },
    growth: { name: 'Growth', price: 99 },
    pro: { name: 'Pro', price: 199 },
  };

  const plan = planNames[workspace?.plan || 'starter'] || planNames.starter;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Billing</h1>

      {/* Current Plan */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-4">Current Plan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted">Plan</p>
            <p className="text-lg font-bold text-text">{plan.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="text-lg font-bold text-text">${plan.price}/mo</p>
          </div>
          <div>
            <p className="text-xs text-muted">Seats</p>
            <p className="text-lg font-bold text-text">{workspace?.seats_limit === 999 ? 'Unlimited' : workspace?.seats_limit || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Status</p>
            <p className="text-lg font-bold text-green-400 capitalize">{workspace?.status || 'active'}</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-4">Usage This Month</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">Credits Used</span>
          <span className="text-sm font-medium text-text">{credits.used.toLocaleString()} / {credits.total.toLocaleString()}</span>
        </div>
        <div className="w-full h-4 rounded-full bg-surface2 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(credits.used / (credits.total || 1)) * 100}%` }} />
        </div>
        <p className="text-xs text-muted mt-2">{credits.remaining.toLocaleString()} credits remaining this cycle</p>
      </div>

      {/* Invoices Placeholder */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-4">Invoices</h2>
        <p className="text-sm text-muted">Invoice history will appear here once billing is integrated with Paystack.</p>
      </div>
    </div>
  );
}
