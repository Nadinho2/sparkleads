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
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PlanConfig } from '@/lib/stripe';

declare global {
  interface Window {
    PaystackPop?: {
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

const isFreeAccess = process.env.NEXT_PUBLIC_FREE_ACCESS === 'true';

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('solo');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'paystack'>('stripe');
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
    const initialPlan = params.get('plan');
    if (initialPlan && PLANS[initialPlan]) {
      setSelectedPlanId(initialPlan);
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
      toast.error('Something went wrong during activation');
    } finally {
      setActivating(false);
    }
  };

  const verifyPayment = useCallback(
    async (reference: string, customerEmail: string) => {
      try {
        const response = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference,
            email: customerEmail,
            password: password || undefined,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success('Payment verified! Welcome to SparkLeads.');
          router.push('/dashboard');
        } else {
          toast.error(data.error || 'Payment verification failed');
          setProcessing(false);
        }
      } catch {
        toast.error('Error verifying payment. Please contact support.');
        setProcessing(false);
      }
    },
    [password, router]
  );

  const handleStripeCheckout = async () => {
    if (!isLoggedIn) {
      if (!email.trim() || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingInterval,
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'stripe_not_configured') {
          toast.info('Stripe account is currently pending activation. You can also switch to Paystack below.');
        } else {
          toast.error(data.error || 'Checkout initialization failed');
        }
        setProcessing(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('No checkout URL returned. Please try again.');
        setProcessing(false);
      }
    } catch {
      setProcessing(false);
      toast.error('Something went wrong initiating checkout');
    }
  };

  const handlePaystackCheckout = async () => {
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

      if (initData.authorization_url) {
        window.location.href = initData.authorization_url;
      } else {
        setProcessing(false);
        toast.error('Payment gateway unavailable');
      }
    } catch {
      setProcessing(false);
      toast.error('Payment initialization error');
    }
  };

  const handlePayment = () => {
    if (paymentGateway === 'stripe') {
      handleStripeCheckout();
    } else {
      handlePaystackCheckout();
    }
  };

  const selectedPlan: PlanConfig = PLANS[selectedPlanId] || PLANS.solo;
  const isAnnual = billingInterval === 'year';
  const displayPrice = isAnnual
    ? `$${(selectedPlan.priceAnnual / 12 / 100).toFixed(0)}`
    : `$${(selectedPlan.priceMonthly / 100).toFixed(0)}`;
  const totalBilled = isAnnual
    ? `$${(selectedPlan.priceAnnual / 100).toFixed(0)} / year`
    : `$${(selectedPlan.priceMonthly / 100).toFixed(0)} / month`;

  if (isFreeAccess) {
    return (
      <main className="min-h-screen bg-background text-text flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-surface text-center shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Free Beta Access</h1>
          <p className="text-sm text-muted mb-6">Create your account to unlock all features instantly.</p>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1.5">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text"
              />
            </div>
            <button
              onClick={handleFreeActivation}
              disabled={activating}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              {activating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate My Account'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-text">SparkLeads</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              {isLoggedIn ? 'Upgrade Your Subscription' : 'Choose Your Plan & Get Started'}
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Supercharge your outbound sales pipeline with verified leads and automated AI outreach.
            </p>

            {/* Billing Interval Toggle */}
            <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-surface border border-border">
              <button
                type="button"
                onClick={() => setBillingInterval('month')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  billingInterval === 'month' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('year')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  billingInterval === 'year' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'
                }`}
              >
                Annual Billing
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  2 Mo Free
                </span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Plan Selector & Value Props */}
            <div className="lg:col-span-7 space-y-6">
              {/* Plan Choice Cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                {Object.values(PLANS).map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const priceStr = isAnnual
                    ? `$${(p.priceAnnual / 12 / 100).toFixed(0)}`
                    : `$${(p.priceMonthly / 100).toFixed(0)}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary'
                          : 'border-border bg-surface hover:border-primary/40'
                      }`}
                    >
                      {p.id === 'growth' && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white uppercase">
                          Popular
                        </span>
                      )}
                      <p className="text-xs font-semibold text-muted uppercase">{p.name}</p>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-text">{priceStr}</span>
                        <span className="text-xs text-muted">/mo</span>
                      </div>
                      <p className="text-xs text-muted mt-2">
                        {p.monthlyCredits.toLocaleString()} monthly leads/credits
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Selected Plan Details Box */}
              <div className="p-6 rounded-2xl border border-border bg-surface">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <div>
                    <h2 className="text-lg font-bold text-text">{selectedPlan.name} Includes:</h2>
                    <p className="text-xs text-muted">Everything you need to launch predictable sales pipeline</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {displayPrice}/mo
                  </span>
                </div>

                <ul className="grid sm:grid-cols-2 gap-3">
                  {selectedPlan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs text-text">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>7-day money back guarantee</span>
                  </div>
                  <span>Cancel anytime with 1-click</span>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout Form */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xl">
                <h2 className="text-xl font-bold text-text mb-4">
                  {isLoggedIn ? 'Confirm Your Upgrade' : 'Create Account & Checkout'}
                </h2>

                <div className="space-y-4">
                  {!isLoggedIn && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                          Work Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {paymentGateway === 'paystack' && (
                        <div>
                          <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                            Account Password
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Min. 6 characters"
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-surface2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Order Summary */}
                  <div className="p-4 rounded-xl bg-surface2 border border-border space-y-2 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>{selectedPlan.name} ({billingInterval === 'year' ? 'Annual' : 'Monthly'})</span>
                      <span className="text-text font-medium">{displayPrice}/mo</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Monthly credits</span>
                      <span className="text-emerald-400 font-semibold">+{selectedPlan.monthlyCredits.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-text">
                      <span>Total Billed</span>
                      <span className="text-primary">{totalBilled}</span>
                    </div>
                  </div>

                  {/* Payment Gateway Toggle */}
                  <div className="pt-2">
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface2 border border-border mb-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentGateway('stripe')}
                        className={`py-2 rounded-lg font-semibold transition-all ${
                          paymentGateway === 'stripe'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        Global (Cards / Apple Pay)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentGateway('paystack')}
                        className={`py-2 rounded-lg font-semibold transition-all ${
                          paymentGateway === 'paystack'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        Paystack (Africa)
                      </button>
                    </div>

                    <button
                      onClick={handlePayment}
                      disabled={processing || (!isLoggedIn && !email.trim())}
                      className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting Gateway...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          {paymentGateway === 'stripe' ? `Pay with Stripe (${totalBilled})` : `Pay with Paystack`}
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-muted flex items-center justify-center gap-1.5 pt-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    256-bit encrypted checkout. Cards, Apple Pay & Google Pay supported.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to SparkLeads home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
