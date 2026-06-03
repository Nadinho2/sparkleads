'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Star,
  Phone,
  MapPin,
  Globe,
  Mail,
  Lock,
  MessageCircle,
  Zap,
  ArrowRight,
  X,
  Check,
  BarChart3,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from '@/components/ui';
import { useSearchStream } from '@/hooks/useSearchStream';
import type { Lead } from '@/types';

const suggestedSearches = [
  'restaurants in Lagos Nigeria',
  'dentists in Abuja Nigeria',
  'salons in London UK',
  'gyms in Nairobi Kenya',
  'hotels in Dubai UAE',
];

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('sparkleads_session_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('sparkleads_session_id', id);
  }
  return id;
}

function getSearchCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('sparkleads_search_count') || '0', 10);
}

function incrementSearchCount(): number {
  const count = getSearchCount() + 1;
  localStorage.setItem('sparkleads_search_count', String(count));
  return count;
}

function cleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[^+\d]/g, '');
}

export default function FreeTrialPage() {
  const isFreeAccess = process.env.NEXT_PUBLIC_FREE_ACCESS === 'true';
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
    setSessionId(getSessionId());
    setSearchCount(getSearchCount());
  }, []);

  useEffect(() => {
    if (error === 'free_limit_reached') {
      setShowPaywall(true);
    }
  }, [error]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;
    if (getSearchCount() >= 3) {
      setShowPaywall(true);
      return;
    }

    setHasSearched(true);
    await search(query);
    const newCount = incrementSearchCount();
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

  const remaining = Math.max(0, 3 - searchCount);

  return (
    <main className="min-h-screen bg-background text-text">
      {/* ==================== HEADER ==================== */}
      <section className="pt-24 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-4">
            See it work before you pay.
          </h1>
          <p className="text-lg text-muted mb-6">
            Run a real search. Get real results. No signup needed.
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
                  Search — Free Preview
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {suggestedSearches.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                disabled={isSearching || remaining <= 0}
                className="px-3 py-1.5 rounded-full border border-border bg-surface2 text-sm text-muted hover:text-text hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== RESULTS AREA ==================== */}
      <section className="pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasSearched && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted" />
              </div>
              <p className="text-lg text-muted">
                Type a business type and city above to start searching
              </p>
            </div>
          )}

          {hasSearched && (
            <>
              {leads.length > 0 && (
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <BarChart3 className="w-4 h-4" />
                    Showing {leads.length} businesses
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {leads.map((lead, i) => (
                  <ResultCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>

              {isSearching && leads.length === 0 && (
                <div className="text-center py-16">
                  <Spinner size="lg" className="mx-auto mb-4 text-primary" />
                  <p className="text-muted">Searching for businesses...</p>
                </div>
              )}

              {isSearching && leads.length > 0 && (
                <div className="text-center py-8">
                  <Spinner size="sm" className="mx-auto text-primary" />
                  <p className="text-sm text-muted mt-2">More results coming in...</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ==================== STICKY BOTTOM BAR ==================== */}
      {hasSearched && leads.length > 0 && !showPaywall && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-muted hidden sm:block">
              Get emails + unlimited searches — ₦19,900 lifetime
            </p>
            <Link
              href="/checkout"
              className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Get Full Access — ₦19,900 lifetime
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ==================== PAYWALL MODAL ==================== */}
      {showPaywall && (
        <PaywallModal
          leadCount={leads.length}
          onClose={() => setShowPaywall(false)}
          isFreeAccess={isFreeAccess}
        />
      )}
    </main>
  );
}

function ResultCard({ lead, index }: { lead: Lead; index: number }) {
  const phoneClean = cleanPhone(lead.phone);

  return (
    <div
      className="p-5 rounded-xl border border-border bg-surface hover:border-primary/30 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text mb-2">{lead.name}</h3>

          <div className="flex items-center gap-4 flex-wrap text-sm">
            <span className="flex items-center gap-1.5">
              {lead.rating ? (
                <>
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="text-text">{lead.rating}</span>
                </>
              ) : (
                <span className="text-muted">No rating</span>
              )}
            </span>

            {lead.phone && (
              <span className="flex items-center gap-1.5 text-muted">
                <Phone className="w-4 h-4" />
                {lead.phone}
              </span>
            )}
          </div>

          {lead.address && (
            <p className="flex items-start gap-1.5 text-sm text-muted mt-2">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {lead.address}
            </p>
          )}

          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
            >
              <Globe className="w-4 h-4" />
              {lead.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
            </a>
          )}

          <div className="flex items-center gap-1.5 text-sm mt-2 relative">
            <Mail className="w-4 h-4 text-muted" />
            {lead.email ? (
              <span className="blur-[6px] select-none text-muted">{lead.email}</span>
            ) : (
              <span className="blur-[6px] select-none text-muted">name@example.com</span>
            )}
            <div className="absolute left-6 flex items-center gap-1 text-xs text-muted bg-surface/80 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3" />
              Unlock with full access
            </div>
          </div>
        </div>

        {phoneClean && (
          <a
            href={`https://wa.me/${phoneClean}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors whitespace-nowrap self-start"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function PaywallModal({
  leadCount,
  onClose,
  isFreeAccess,
}: {
  leadCount: number;
  onClose: () => void;
  isFreeAccess: boolean;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const features = [
    'Unlimited searches forever',
    'Real phone numbers + emails',
    'One-click CSV export',
    'Lead status tracking',
    '195+ countries supported',
    'Lifetime updates',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">
            You&apos;ve used your 2 free searches
          </h2>
          <p className="text-muted">
            You found <span className="text-primary font-semibold">{leadCount} businesses</span>{' '}
            with phone numbers
          </p>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm">
              <Check className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-text">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/checkout"
          className="block w-full text-center px-6 py-4 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 mb-3"
        >
          {isFreeAccess ? 'Go to Dashboard →' : 'Get Full Access — ₦19,900 →'}
        </Link>

        <p className="text-center text-sm text-muted">
          Lifetime access. One payment. No monthly fees.
        </p>
      </div>
    </div>
  );
}
