'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Spinner } from '@/components/ui';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'solo';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-surface text-center shadow-xl">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 text-emerald-400">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold text-text mb-2">Payment Successful!</h1>
      <p className="text-sm text-muted mb-6">
        Thank you for subscribing to SparkLeads. Your plan is activated, and your credits are ready to use.
      </p>

      <div className="p-4 rounded-xl bg-surface2 border border-border mb-6 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Active Plan</p>
            <p className="text-sm font-bold text-text capitalize">{plan} Plan</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
          Active
        </span>
      </div>

      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
      >
        Go to Dashboard ({countdown}s)
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<Spinner size="lg" />}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
