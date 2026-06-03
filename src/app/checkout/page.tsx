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
  Lock,
  Eye,
  EyeOff,
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const referenceRef = useRef('');

  const [activating, setActivating] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.email) {
          setIsLoggedIn(true);
          setEmail(data.email);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAuth(false));
  }, []);

  const handleFreeActivation = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password.trim() || password.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setActivating(true);
    try {
      const res = await fetch('/api/activate-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
      });

      if (res.ok) {
        toast.success('Welcome to SparkLeads!');
        router.push('/dashboard');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Activation failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setActivating(false);
    }
  };

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
    script.onerror = () => setScriptLoaded(false);
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById('paystack-inline-js');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  // Handle Paystack redirect callback (when inline popup redirects back)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (ref && !processing) {
      setProcessing(true);
      toast.info('Verifying your payment...');
      const storedEmail = localStorage.getItem('sparkleads_checkout_email') || '';

      fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref, email: storedEmail }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success('Payment successful! Welcome to SparkLeads!');
            localStorage.removeItem('sparkleads_checkout_email');
            window.location.href = '/dashboard';
          } else {
            toast.error('Verification failed', {
              description: data.error || 'Please contact support.',
            });
            setProcessing(false);
          }
        })
        .catch(() => {
          toast.error('Verification failed. Please contact support.');
          setProcessing(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.success('Payment successful! Welcome to SparkLeads!');
        localStorage.removeItem('sparkleads_checkout_email');
        window.location.href = '/dashboard';
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
    if (!isLoggedIn) {
      if (!email.trim() || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }

      if (!password.trim() || password.trim().length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    setProcessing(true);

    // Store email for redirect callback verification
    localStorage.setItem('sparkleads_checkout_email', email.trim().toLowerCase());

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

      // Try inline popup first
      if (scriptLoaded && window.PaystackPop && paystackKey) {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: email.trim().toLowerCase(),
          amount: 1990000,
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
      } else if (initData.authorization_url) {
        // Fallback: redirect to Paystack hosted page
        window.location.href = initData.authorization_url;
      } else {
        setProcessing(false);
        toast.error('Payment system not available. Please check your configuration.');
      }
    } catch {
      setProcessing(false);
      toast.error('Something went wrong. Please try again.');
    }
  }, [email, password, referralCode, scriptLoaded, verifyPayment, isLoggedIn]);

  if (isFreeAccess) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-text">SparkLeads</span>
          </Link>
          <div className="text-5xl mb-6">⚡</div>
          <h1 className="text-2xl font-bold text-text mb-2">Get Free Access to SparkLeads</h1>
          <p className="text-muted mb-8">Enter your email to activate your account. You&apos;ll use this to log in on any device.</p>

          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="free-email" className="block text-sm font-medium text-text mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="free-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFreeActivation()}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  disabled={activating}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted mt-2">
                Use a real email — you&apos;ll need it to log in later
              </p>
            </div>

            <button
              onClick={handleFreeActivation}
              disabled={activating || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  Activate My Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
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
                  <span className="text-2xl text-muted line-through">₦59,700</span>
                  <span className="text-5xl font-bold text-text">₦19,900</span>
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
                {!isLoggedIn && (
                  <>
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
                        <Lock className="w-4 h-4 inline mr-1.5" />
                        Create Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                          className="w-full px-4 pr-10 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-muted">
                        You&apos;ll use this to log in to your account
                      </p>
                    </div>
                  </>
                )}

                {isLoggedIn && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <p className="text-sm text-text">
                      <span className="font-medium">Upgrading account:</span> {email}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Your lifetime access will be added to your existing account.
                    </p>
                  </div>
                )}

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
                    disabled={processing || (!isLoggedIn && !email.trim()) || loadingAuth}
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
                        Pay with Card — ₦19,900
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
