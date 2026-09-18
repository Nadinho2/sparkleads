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
  'Unlimited searches every month',
  '200+ leads per search',
  'Monthly outreach tokens included',
  'Unused tokens roll over automatically',
  'Real phone numbers & verified emails',
  'One-click CSV export',
  'Lead status tracking & CRM pipeline',
  'Email discovery engine',
  'Priority support',
  'Cancel anytime with 1 click',
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
  const [alreadyUsed, setAlreadyUsed] = useState(false);

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

  // Capture referral code from URL query parameter (?ref=... or ?referral=...) or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('ref') || params.get('referral');
    const storedCode = localStorage.getItem('sparkleads_referral');
    const codeToApply = (codeFromUrl || storedCode || '').trim();
    if (codeToApply) {
      setReferralCode(codeToApply);
      localStorage.setItem('sparkleads_referral', codeToApply);
    }
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
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          referral_code: referralCode.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Welcome to SparkLeads!');
        router.push('/dashboard');
      } else {
        const data = await res.json();
        if (res.status === 409 || data.code === 'EMAIL_ALREADY_USED') {
          setAlreadyUsed(true);
          setPassword('');
          toast.error(data.error || 'This email has already been registered.');
        } else {
          toast.error(data.error || 'Activation failed');
        }
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
          amount: 899900,
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

  if (loadingAuth) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Checking account status...</p>
        </div>
      </main>
    );
  }

  if (isFreeAccess) {
    if (isLoggedIn) {
      return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center p-8 rounded-2xl border border-border bg-surface shadow-xl">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-text">SparkLeads</span>
            </Link>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Account Already Active</h1>
            <p className="text-sm text-muted mb-6">
              You are currently logged in as <span className="text-text font-semibold">{email}</span>.
              Free testing access is active on this system.
            </p>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </main>
      );
    }

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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (alreadyUsed) setAlreadyUsed(false);
                  }}
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

            {alreadyUsed && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                <p className="text-sm font-medium text-amber-400">Email Already Registered</p>
                <p className="text-xs text-muted">
                  This email has already been used for an account or free trial. Please log in to your account.
                </p>
                <Link
                  href={`/login?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                >
                  Log in to account &rarr;
                </Link>
              </div>
            )}

            <div>
              <label htmlFor="free-password" className="block text-sm font-medium text-text mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="free-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFreeActivation()}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  disabled={activating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted mt-1.5">
                You&apos;ll use this to log in on other devices
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="free-ref" className="text-sm font-medium text-text flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary" />
                  Referral Code
                  <span className="text-muted font-normal text-xs">(optional)</span>
                </label>
                {referralCode.trim() && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Referral applied
                  </span>
                )}
              </div>
              <input
                id="free-ref"
                type="text"
                value={referralCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setReferralCode(val);
                  if (val.trim()) {
                    localStorage.setItem('sparkleads_referral', val.trim());
                  } else {
                    localStorage.removeItem('sparkleads_referral');
                  }
                }}
                placeholder="Enter referral code"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-mono tracking-wide"
                disabled={activating}
              />
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
              {isLoggedIn ? 'Upgrade Your Subscription' : 'Complete Your Subscription'}
            </h1>
            <p className="text-lg text-muted">
              {isLoggedIn
                ? 'Activate your SparkLeads Pro monthly plan • Unused tokens roll over • Cancel anytime'
                : 'Monthly subscription • Unused tokens roll over • Cancel anytime'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border-2 border-primary bg-surface relative overflow-hidden">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-bold rounded-full">
                MONTHLY SUBSCRIPTION
              </div>

              <div className="text-center mt-4 mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-2xl text-muted line-through">₦19,900</span>
                  <span className="text-5xl font-bold text-text">₦8,999</span>
                  <span className="text-muted text-lg">/mo</span>
                </div>
                <p className="text-sm text-muted">Monthly subscription &bull; Tokens roll over</p>
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
                {isLoggedIn ? 'Confirm & Subscribe' : 'Payment Details'}
              </h2>

              <div className="space-y-5">
                {!isLoggedIn && (
                  <>
                    <div className="p-3.5 rounded-xl bg-surface2 border border-border text-xs text-muted flex items-center justify-between">
                      <span>Already have a SparkLeads account?</span>
                      <Link
                        href="/login?redirect=/checkout"
                        className="text-primary font-semibold hover:underline"
                      >
                        Log in to upgrade &rarr;
                      </Link>
                    </div>

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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-text flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-primary" />
                          Referral Code
                          <span className="text-muted font-normal text-xs">(optional)</span>
                        </label>
                        {referralCode.trim() && (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Referral applied
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReferralCode(val);
                          if (val.trim()) {
                            localStorage.setItem('sparkleads_referral', val.trim());
                          } else {
                            localStorage.removeItem('sparkleads_referral');
                          }
                        }}
                        placeholder="Enter referral code (e.g. ab12cd34)"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-mono tracking-wide"
                      />
                    </div>
                  </>
                )}

                {isLoggedIn && (
                  <>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {email ? email[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="text-xs text-muted">Upgrading Existing Account</p>
                            <p className="text-sm font-semibold text-text">{email}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active Session
                        </span>
                      </div>
                      <p className="text-xs text-muted pt-1 border-t border-primary/15">
                        Your existing searches, saved leads, and history remain intact. +20 rollover tokens will be credited immediately.
                      </p>
                    </div>

                    {referralCode.trim() ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Referral applied: <code className="font-mono font-bold text-emerald-300">{referralCode}</code>
                        </span>
                      </div>
                    ) : (
                      <details className="text-xs text-muted group">
                        <summary className="cursor-pointer hover:text-text flex items-center gap-1.5 select-none font-medium py-1">
                          <Tag className="w-3.5 h-3.5 text-primary" /> Have a promo or referral code?
                        </summary>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReferralCode(val);
                              if (val.trim()) {
                                localStorage.setItem('sparkleads_referral', val.trim());
                              } else {
                                localStorage.removeItem('sparkleads_referral');
                              }
                            }}
                            placeholder="Enter code (e.g. ref123)"
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-mono"
                          />
                        </div>
                      </details>
                    )}
                  </>
                )}

                <div className="space-y-2 p-3.5 rounded-xl bg-surface2 border border-border text-xs">
                  <div className="flex justify-between text-muted">
                    <span>SparkLeads Monthly Plan</span>
                    <span className="text-text font-medium">₦8,999 / mo</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Monthly tokens included</span>
                    <span className="text-emerald-400 font-medium">+20 (Rolls over)</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold text-text text-sm">
                    <span>Total due today</span>
                    <span className="text-primary font-bold">₦8,999</span>
                  </div>
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
                        Subscribe with Card — ₦8,999/mo
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
                  <span>Tokens roll over every month</span>
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
