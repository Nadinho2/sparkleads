'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { AdPlanResults } from '@/components/dashboard/AdPlanResults';
import type { AdPlan } from '@/lib/ad-plan-generator';

interface SavedPlanData {
  id: string;
  business_name: string;
  business_type: string;
  goal: string;
  budget: number;
  budget_currency: string;
  location: string | null;
  website: string | null;
  extra_context: string | null;
  plan: AdPlan;
  created_at: string;
}

export default function AdPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [planData, setPlanData] = useState<SavedPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/ads/${planId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load ad plan');
        return;
      }

      setPlanData(data.plan);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-semibold text-text mb-2">Ad plan not found</h3>
        <p className="text-sm text-muted mb-4">{error || 'This plan may have been deleted.'}</p>
        <button
          onClick={() => router.push('/dashboard/ads/history')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Saved Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/ads/history')}
          className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Saved Plans
        </button>
        <button
          onClick={() => {
            localStorage.setItem('sparkleads_brief_plan', planId);
            router.push('/dashboard/briefs/new');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition-all"
        >
          <FileText size={15} />
          Generate Creative Brief
        </button>
      </div>

      <AdPlanResults
        plan={planData.plan}
        businessName={planData.business_name}
        budget={planData.budget}
        currency={planData.budget_currency}
      />
    </div>
  );
}
