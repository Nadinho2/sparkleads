'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Target,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
import { AdPlanResults } from '@/components/dashboard/AdPlanResults';
import type { AdPlan } from '@/lib/ad-plan-generator';

const BUSINESS_TYPES = [
  'Hair Salon', 'Restaurant', 'Hotel', 'Gym', 'Pharmacy',
  'Boutique', 'Real Estate', 'School', 'Hospital', 'Supermarket',
  'Bar/Lounge', 'Bakery', 'Auto Repair', 'Event Venue', 'Photography Studio',
  'Laundry', 'Spa', 'Clinic', 'Law Firm', 'Dental Clinic',
  'Pet Store', 'Cleaning Service', 'Catering', 'Fashion Store', 'Tech Store',
];

const GOALS = [
  'Get More Customers',
  'Drive Website Traffic',
  'Promote an Offer',
  'Build Brand Awareness',
  'Get Phone Calls',
];

const BUDGET_CHIPS: Record<string, number[]> = {
  NGN: [50000, 100000, 200000, 500000],
  USD: [50, 100, 300, 500],
  GBP: [50, 100, 300, 500],
  KES: [5000, 10000, 30000, 50000],
  GHS: [300, 500, 1000, 2000],
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  KES: 'KSh',
  GHS: 'GH₵',
};

export default function AdsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessTypeSearch, setBusinessTypeSearch] = useState('');
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [budgetCurrency, setBudgetCurrency] = useState('NGN');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<AdPlan | null>(null);
  const [planBusinessName, setPlanBusinessName] = useState('');
  const [planBudget, setPlanBudget] = useState(0);
  const [planCurrency, setPlanCurrency] = useState('');

  useEffect(() => {
    fetch('/api/credits/ensure')
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(0));
  }, []);

  const filteredTypes = BUSINESS_TYPES.filter((t) =>
    t.toLowerCase().includes(businessTypeSearch.toLowerCase())
  ).slice(0, 6);

  const chips = BUDGET_CHIPS[budgetCurrency] || BUDGET_CHIPS.NGN;
  const sym = CURRENCY_SYMBOLS[budgetCurrency] || budgetCurrency;

  const generatePlan = useCallback(async () => {
    if (!businessName.trim() || !businessType.trim() || !budget || balance < 5) return;

    setIsGenerating(true);
    setGeneratedPlan(null);

    try {
      const res = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          goal,
          budget,
          budgetCurrency,
          location: location.trim() || undefined,
          website: website.trim() || undefined,
          extraContext: extraContext.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'insufficient_credits') {
          toast.error('Not enough credits. You need 5 credits.');
          return;
        }
        toast.error(data.error || 'Failed to generate ad plan');
        return;
      }

      setGeneratedPlan(data.plan);
      setPlanBusinessName(businessName.trim());
      setPlanBudget(budget);
      setPlanCurrency(budgetCurrency);
      setBalance((prev) => prev - 5);
      toast.success('Ad plan generated successfully!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [businessName, businessType, goal, budget, budgetCurrency, location, website, extraContext, balance]);

  const canGenerate = businessName.trim() && businessType.trim() && budget > 0 && goal && balance >= 5;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN — INPUT FORM */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text">Ad Campaign Planner</h1>
            <p className="text-sm text-muted mt-1">
              Tell us about the business and we&apos;ll build a complete ad strategy.
            </p>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Business Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Glamour Touch Salon"
              className="w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border"
            />
          </div>

          {/* Business Type */}
          <div className="relative">
            <label className="block text-sm font-medium text-text mb-1.5">
              Business Type <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessTypeSearch || businessType}
                onChange={(e) => {
                  setBusinessTypeSearch(e.target.value);
                  setBusinessType(e.target.value);
                  setShowTypeSuggestions(true);
                }}
                onFocus={() => setShowTypeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
                placeholder="e.g. Hair Salon, Restaurant, Gym..."
                className="w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
            {showTypeSuggestions && businessTypeSearch && filteredTypes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
                {filteredTypes.map((t) => (
                  <button
                    key={t}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBusinessType(t);
                      setBusinessTypeSearch('');
                      setShowTypeSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-surface2 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Primary Goal <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    goal === g
                      ? 'bg-primary text-white'
                      : 'bg-surface2 text-muted hover:text-text border border-border'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Monthly Budget <span className="text-danger">*</span>
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={budget || ''}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="0"
                className="flex-1 rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border"
              />
              <select
                value={budgetCurrency}
                onChange={(e) => {
                  setBudgetCurrency(e.target.value);
                  setBudget(0);
                }}
                className="rounded-lg border bg-surface px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="KES">KES (KSh)</option>
                <option value="GHS">GHS (GH₵)</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setBudget(chip)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    budget === chip
                      ? 'bg-primary text-white'
                      : 'bg-surface2 text-muted hover:text-text border border-border'
                  }`}
                >
                  {sym}{chip.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Business Location */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Business Location <span className="text-xs text-muted">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lekki, Lagos or leave blank for online-only"
              className="w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Business Website <span className="text-xs text-muted">(optional)</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border"
            />
          </div>

          {/* Extra Context */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Any extra context <span className="text-xs text-muted">(optional)</span>
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => {
                if (e.target.value.length <= 500) setExtraContext(e.target.value);
              }}
              placeholder="e.g. We're running a 50% off promo this month, targeting new customers only, we've tried Facebook before..."
              rows={4}
              className="w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors border-border resize-none"
            />
            <p className="text-xs text-muted text-right mt-1">{extraContext.length}/500</p>
          </div>

          {/* Credit Cost Notice */}
          <div className="rounded-lg bg-surface2 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-text">This uses 5 credits</p>
                <p className="text-xs text-muted">Your balance: {balance} credits</p>
              </div>
            </div>
            {balance < 5 && (
              <Link href="/dashboard/credits" className="text-xs text-primary underline">
                Get more credits
              </Link>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePlan}
            disabled={!canGenerate || isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" />
                Building your ad plan...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Ad Plan — 5 Credits
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN — RESULTS */}
        <div>
          {isGenerating && (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border border-border bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <Spinner size="md" className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-text">Building your ad plan...</p>
                    <p className="text-xs text-muted">Researching market and crafting your strategy</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 rounded bg-surface2 w-full mb-2" style={{ width: `${100 - i * 10}%` }} />
                      <div className="h-3 rounded bg-surface2 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isGenerating && !generatedPlan && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-surface2 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Your ad plan will appear here</h3>
              <p className="text-sm text-muted max-w-sm">
                Fill in the business details and hit Generate to get a complete advertising strategy.
              </p>
            </div>
          )}

          {!isGenerating && generatedPlan && (
            <AdPlanResults
              plan={generatedPlan}
              businessName={planBusinessName}
              budget={planBudget}
              currency={planCurrency}
              onRegenerate={generatePlan}
            />
          )}
        </div>
      </div>
    </div>
  );
}
