'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Calendar,
  Eye,
  Trash2,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  KES: 'KSh',
  GHS: 'GH₵',
};

const GOAL_BADGES: Record<string, string> = {
  'Get More Customers': 'bg-green-500/20 text-green-400',
  'Drive Website Traffic': 'bg-blue-500/20 text-blue-400',
  'Promote an Offer': 'bg-orange-500/20 text-orange-400',
  'Build Brand Awareness': 'bg-purple-500/20 text-purple-400',
  'Get Phone Calls': 'bg-cyan-500/20 text-cyan-400',
};

interface SavedPlan {
  id: string;
  business_name: string;
  business_type: string;
  goal: string;
  budget: number;
  budget_currency: string;
  created_at: string;
}

export default function AdHistoryPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/ads/list');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      toast.error('Failed to load ad plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this ad plan?')) return;

    setDeleting(planId);
    try {
      const res = await fetch('/api/ads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
        toast.success('Ad plan deleted');
      } else {
        toast.error('Failed to delete plan');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setDeleting(null);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-text">Your Ad Plans</h1>
        <p className="text-sm text-muted mt-1">
          View and manage your previously generated ad strategies.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No ad plans yet</h3>
          <p className="text-sm text-muted max-w-sm mb-4">
            Generate your first ad plan to see it here.
          </p>
          <Link
            href="/dashboard/ads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Target className="w-4 h-4" />
            Create Ad Plan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const sym = CURRENCY_SYMBOLS[plan.budget_currency] || plan.budget_currency;
            return (
              <div
                key={plan.id}
                className="p-5 rounded-xl border border-border bg-surface hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text">{plan.business_name}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-muted">{plan.business_type}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${GOAL_BADGES[plan.goal] || 'bg-primary/20 text-primary'}`}>
                        {plan.goal}
                      </span>
                      <span className="text-xs font-medium text-text">
                        {sym}{plan.budget.toLocaleString()}/mo
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(plan.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/ads/${plan.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Plan
                    </Link>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-50"
                    >
                      {deleting === plan.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
