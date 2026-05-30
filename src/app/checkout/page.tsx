'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Check,
  Shield,
  CreditCard,
  Loader2,
  ArrowRight,
  Mail,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  onClose: () => void;
  callback: (response: { reference: string }) => void;
}

const pricingFeatures = [
  'Unlimited searches forever',
  '200+ leads per search',
  'Real phone numbers & emails',
  'One-click CSV export',
  'Lead status tracking',
  'Email discovery engine',
  '195+ countries supported',
  'Priority support',
  'Lifetime updates included',
];

const isFreeAccess = process.env.NEXT_PUBLIC_FREE_ACCESS === 'true';

export default function CheckoutPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const referenceRef = useRef('');

  useEffect(() => {
    if (isFreeAccess) {
      fetch('/api/activate-free')
        .then(() => router.push('/dashboard'));
    }
  }, [router]);

  useEffect(() => {
    if (document.getElementById('paystack-inline-js')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById('paystack-inline-js');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  const verifyPayment = useCallback(async (reference: string, customerEmail: string) => {
    try {
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, email: customerEmail }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment successful!', {
          description: 'Check your email for the activation link.',
          duration: 8000,
        });
        return true;
      }

      toast.error('Verification failed', {
        description: data.error || 'Please contact support.',
      });
      return false;
    } catch {
      toast.error('Verification failed', {
        description: 'Could not verify payment. Please contact support.',
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, []);

  const handlePayment = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!scriptLoaded || !window.PaystackPop) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) {
      toast.error('Payment is not configured. Please contact support.');
      return;
    }

    setProcessing(true);

    try {
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          referral_code: referralCode.trim() || undefined,
        }),
      });

      const initData = await initRes.json();

      if (!initRes.ok) {
        toast.error(initData.error || 'Failed to initialize payment');
        setProcessing(false);
        return;
      }

      referenceRef.current = initData.reference;

      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: email.trim().toLowerCase(),
        amount: 1500,
        ref: initData.reference,
        onClose: () => {
          setProcessing(false);
          toast.info('Payment cancelled', {
            description: 'You can retry when you\'re ready.',
          });
        },
        callback: (response: { reference: string }) => {
          toast.success('Verifying payment...');
          verifyPayment(response.reference, email.trim().toLowerCase());
        },
      });

      handler.openIframe();
    } catch {
      setProcessing(false);
      toast.error('Something went wrong. Please try again.');
    }
  }, [email, referralCode, scriptLoaded, verifyPayment]);

  if (isFreeAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-5xl">⚡</div>
          <h1 className="text-2xl font-bold text-text">Activating SparkLeads...</h1>
          <p className="text-muted text-sm">Setting up your personal access</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-text">SparkLeads</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              Complete Your Purchase
            </h1>
            <p className="text-lg text-muted">
              One payment. Lifetime access. No subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border-2 border-primary bg-surface relative overflow-hidden">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-bold rounded-full">
                LIFETIME ACCESS
              </div>

              <div className="text-center mt-4 mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-2xl text-muted line-through">$45</span>
                  <span className="text-5xl font-bold text-text">$15</span>
                </div>
                <p className="text-sm text-muted">One-time payment</p>
              </div>

              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm text-text">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <Shield className="w-4 h-4 text-success" />
                <span>7-day money-back guarantee</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-surface">
              <h2 className="text-xl font-semibold text-text mb-6">
                Payment Details
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <Mail className="w-4 h-4 inline mr-1.5" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    We&apos;ll send your activation link to this email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <Tag className="w-4 h-4 inline mr-1.5" />
                    Referral Code
                    <span className="text-muted font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePayment}
                    disabled={processing || !email.trim() || !scriptLoaded}
                    className="w-full px-6 py-4 rounded-xl bg-primary text-white text-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay with Card — $15
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Shield className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted">
                    Secured by Paystack. Your card details never touch our servers.
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Check className="w-4 h-4 text-success" />
                  <span>Instant access after payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted mt-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Activation link sent to your email</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted mt-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>7-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
