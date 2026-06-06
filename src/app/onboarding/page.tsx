'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { Spinner } from '@/components/ui';

export default function OnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);

  const selectType = async (type: 'individual' | 'agency') => {
    setSaving(type);
    try {
      await fetch('/api/settings/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: type }),
      });
      if (type === 'agency') {
        router.push('/onboarding/agency');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push(type === 'agency' ? '/onboarding/agency' : '/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">How will you use SparkLeads?</h1>
          <p className="text-muted">Choose your account type. You can always add agency features later.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Individual Card */}
          <button
            onClick={() => selectType('individual')}
            disabled={!!saving}
            className="group text-left p-8 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all"
          >
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-text mb-2">Individual</h2>
            <p className="text-sm text-muted mb-6">
              I&apos;m a freelancer or solo operator finding leads for my own services.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-muted">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Personal lead search</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Individual outreach</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Content for your clients</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Pay-as-you-go credits</li>
            </ul>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary group-hover:underline">
                {saving === 'individual' ? <Spinner size="sm" /> : 'Start as Individual →'}
              </span>
              <span className="text-xs text-muted">Your $15 covers this</span>
            </div>
          </button>

          {/* Agency Card */}
          <button
            onClick={() => selectType('agency')}
            disabled={!!saving}
            className="group text-left p-8 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:border-primary transition-all"
          >
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-text mb-2">Agency</h2>
            <p className="text-sm text-muted mb-6">
              I run an agency with a team and manage multiple clients.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-muted">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Everything in Individual</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Team member seats</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Shared client workspace</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Agency analytics</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Monthly credits included</li>
            </ul>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary group-hover:underline">
                {saving === 'agency' ? <Spinner size="sm" /> : 'Upgrade to Agency →'}
              </span>
              <span className="text-xs text-muted">From $49/month</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
