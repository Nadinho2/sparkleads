'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Star,
  Phone,
  MapPin,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  X,
  Check,
  BarChart3,
} from 'lucide-react';
import { Spinner } from '@/components/ui';
import { useSearchStream } from '@/hooks/useSearchStream';
import { toast } from 'sonner';

const suggestedSearches = [
  'restaurants in Lagos Nigeria',
  'dentists in Abuja Nigeria',
  'salons in London UK',
  'gyms in Nairobi Kenya',
  'hotels in Dubai UAE',
];

export default function FreeTrialPage() {
  const router = useRouter();
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const [query, setQuery] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { leads, isSearching, error, search } = useSearchStream({
    sessionId,
    isPaid: false,
  });

  useEffect(() => {
    // Check if user already has an account (cookie exists)
    const hasToken = document.cookie.includes('sparkleads_token');
    if (hasToken) {
      setIsSignedUp(true);
    }

    // Generate session ID for search tracking
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('sparkleads_session_id');
      if (!sid) {
        sid = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
        localStorage.setItem('sparkleads_session_id', sid);
      }
      setSessionId(sid);
      setSearchCount(parseInt(localStorage.getItem('sparkleads_search_count') || '0', 10));
    }
  }, []);

  useEffect(() => {
    if (error === 'free_limit_reached') {
      setShowPaywall(true);
    }
  }, [error]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    if (!signupPassword.trim() || signupPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Account created! You have 5 free credits.');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Signup failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const currentCount = parseInt(localStorage.getItem('sparkleads_search_count') || '0', 10);
    if (currentCount >= 3) {
      setShowPaywall(true);
      return;
    }

    setHasSearched(true);
    await search(query);

    const newCount = currentCount + 1;
    localStorage.setItem('sparkleads_search_count', String(newCount));
    setSearchCount(newCount);

    if (newCount >= 3) {
      setShowPaywall(true);
    }
  }, [query, isSearching, search]);

  const handleChipClick = useCallback((chip: string) => {
    setQuery(chip);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  const remaining = Math.max(0, 3 - searchCount);

  // Show signup form if not signed up
  if (!isSignedUp) {
    return (
      <main className="min-h-screen bg-background text-text flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
              Try SparkLeads Free
            </h1>
            <p className="text-muted">
              Create a free account to get 3 lead searches. No payment required.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@business.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {signupLoading ? 'Creating account...' : 'Start Free Trial'}
              {!signupLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-muted">
            By creating an account, you agree to our{' '}
            <a href="/legal/terms" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>

          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">Log in</Link>
          </p>

          <div className="mt-8 flex flex-col gap-2">
            {['3 free lead searches', 'Full contact details included', 'No credit card required'].map((text) => (
              <div key={text} className="flex items-center gap-2 text-xs text-muted">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text">
      {/* ==================== HEADER ==================== */}
      <section className="pt-24 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-4">
            See it work before you pay.
          </h1>
          <p className="text-lg text-muted mb-6">
            Run a real search. Get real results.
          </p>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
              remaining > 0
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-danger/30 bg-danger/10 text-danger'
            }`}
          >
            <Zap className="w-4 h-4" />
            {remaining > 0
              ? `${remaining} free search${remaining !== 1 ? 'es' : ''} remaining`
              : 'Free searches used up'}
          </div>
        </div>
      </section>

      {/* ==================== SEARCH AREA ==================== */}
      <section className="pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g. "restaurants in Lagos Nigeria"'
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-base"
                disabled={isSearching || remaining <= 0}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim() || remaining <= 0}
              className="px-6 py-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isSearching ? (
                <>
                  <Spinner size="sm" />
                  Searching...
                </>
              ) : (
                <>
                  Search
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedSearches.map((s) => (
              <button
                key={s}
                onClick={() => handleChipClick(s)}
                disabled={isSearching || remaining <= 0}
                className="px-3 py-1.5 rounded-full bg-surface2 text-muted text-xs hover:text-text hover:bg-surface transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ERROR ==================== */}
      {error && error !== 'free_limit_reached' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        </div>
      )}

      {/* ==================== RESULTS ==================== */}
      {hasSearched && !isSearching && leads.length === 0 && !error && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <Search className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-text font-medium mb-1">No results found</p>
            <p className="text-sm text-muted">Try a different search term</p>
          </div>
        </div>
      )}

      {leads.length > 0 && (
        <section className="pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">
                Found <span className="text-text font-semibold">{leads.length}</span> results
              </p>
              <button
                onClick={() => handleCopy(leads.map((l) => `${l.name}\t${l.phone || l.email || l.website || ''}`).join('\n'))}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Copy all
              </button>
            </div>

            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.place_id}
                  className="rounded-xl border border-border bg-surface p-4 sm:p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-text truncate">
                          {lead.name}
                        </h3>
                        {lead.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-400 shrink-0">
                            <Star className="w-3 h-3 fill-current" />
                            {lead.rating}
                          </span>
                        )}
                      </div>
                      {lead.address && (
                        <p className="text-xs text-muted flex items-center gap-1.5 mb-3">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {lead.address}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {lead.phone && (
                          <button
                            onClick={() => handleCopy(lead.phone!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 text-xs text-text hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </button>
                        )}
                        {lead.email && (
                          <button
                            onClick={() => handleCopy(lead.email!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 text-xs text-text hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </button>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 text-xs text-text hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Globe className="w-3 h-3" />
                            Website
                          </a>
                        )}

                      </div>
                    </div>


                  </div>
                </div>
              ))}
            </div>

            {isSearching && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Spinner size="sm" />
                Fetching more results...
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== PAYWALL MODAL ==================== */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 text-center">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 text-muted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>

            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
              Free searches used up
            </h2>
            <p className="text-muted mb-6">
              Unlock unlimited searches, email extraction, and AI ad tools for a one-time payment.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {['Unlimited lead searches', 'Email + WhatsApp extraction', 'AI ad planner & content generator'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-text">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Full Access — ₦19,900
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="mt-3 text-xs text-muted">
              One-time payment. Lifetime access. No subscription.
            </p>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM BAR ==================== */}
      {hasSearched && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-3 sm:p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-text font-medium">
                {remaining > 0 ? `${remaining} search${remaining !== 1 ? 'es' : ''} left` : 'Upgrade to continue'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {remaining <= 0 && (
                <Link
                  href="/dashboard"
                  className="text-sm text-muted hover:text-text transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
              <Link
                href="/checkout"
                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                Get Full Access — ₦19,900
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
