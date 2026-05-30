'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Copy,
  Check,
  MessageCircle,
  Share2,
  Link2,
  ArrowRight,
  Zap,
  Send,
} from 'lucide-react';
import { Spinner } from '@/components/ui';

interface AffiliateData {
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
  pending_payout: number;
  conversion_rate: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
}

export default function AffiliatePage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = affiliate ? `${appUrl}/?ref=${affiliate.referral_code}` : '';

  const whatsappTemplate = affiliate
    ? `Hey! I've been using SparkLeads to find business leads and it's incredible. You can search any business type in any city and get real phone numbers, emails, and addresses instantly. Check it out: ${referralLink}`
    : '';

  const tweetTemplate = affiliate
    ? `I've been using @SparkLeads to find 200+ business leads in 60 seconds. Real phone numbers, emails, addresses — all for a one-time $15. No monthly fees. Check it out: ${referralLink}`
    : '';

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/affiliate/stats');
        if (response.ok) {
          const data = await response.json();
          setAffiliate(data.affiliate);
          setPayouts(data.payouts);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }, [referralLink]);

  const handleCopyTemplate = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplate(id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch {
      // Silent fail
    }
  }, []);

  const handleShareWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(whatsappTemplate)}`,
      '_blank'
    );
  }, [whatsappTemplate]);

  const handleShareTwitter = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetTemplate)}`,
      '_blank'
    );
  }, [tweetTemplate]);

  const handlePayoutSubmit = useCallback(async () => {
    if (!affiliate || !bankName || !accountNumber || !accountName) return;

    setPayoutLoading(true);
    try {
      const response = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: affiliate.total_earnings,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        }),
      });

      if (response.ok) {
        setPayoutSuccess(true);
        setShowPayoutForm(false);
        setBankName('');
        setAccountNumber('');
        setAccountName('');

        const statsRes = await fetch('/api/affiliate/stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setAffiliate(data.affiliate);
          setPayouts(data.payouts);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setPayoutLoading(false);
    }
  }, [affiliate, bankName, accountNumber, accountName]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    processing: 'bg-primary/10 text-primary',
    completed: 'bg-success/10 text-success',
    rejected: 'bg-danger/10 text-danger',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Affiliate program not available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">{affiliate.total_referrals}</p>
          <p className="text-sm text-muted">Total Referrals</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">${affiliate.total_earnings.toFixed(2)}</p>
          <p className="text-sm text-muted">Total Earnings</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">${affiliate.pending_payout.toFixed(2)}</p>
          <p className="text-sm text-muted">Pending Payout</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">{affiliate.conversion_rate}%</p>
          <p className="text-sm text-muted">Conversion Rate</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h3 className="text-lg font-semibold text-text mb-4">Your Referral Link</h3>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg bg-surface2 border border-border">
            <Link2 className="w-5 h-5 text-muted flex-shrink-0" />
            <span className="text-sm text-text truncate">{referralLink}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 border border-border transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Twitter / X
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 border border-border transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-border bg-surface text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-text mb-1">Get your link</h4>
            <p className="text-sm text-muted">Share your unique referral link with your audience</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-surface text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-text mb-1">Share it</h4>
            <p className="text-sm text-muted">Post on social media, send to friends, or add to your content</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-surface text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-text mb-1">Get paid</h4>
            <p className="text-sm text-muted">Earn $7.50 for every sale. No cap on earnings.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-4 h-4" />
            50% commission = $7.50 per sale
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
            No cap on earnings
          </span>
        </div>
      </div>

      {/* Payout Request */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h3 className="text-lg font-semibold text-text mb-4">Request Payout</h3>

        {payoutSuccess && (
          <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
            Payout request submitted successfully! We&apos;ll process it within 24-48 hours.
          </div>
        )}

        {payouts.length > 0 && (
          <div className="mb-6 space-y-2">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface2"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    ${Number(payout.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted">{formatDate(payout.created_at)}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    statusColors[payout.status] || 'bg-muted/10 text-muted'
                  }`}
                >
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}

        {!showPayoutForm ? (
          <button
            onClick={() => setShowPayoutForm(true)}
            disabled={affiliate.total_earnings < 10}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Request Payout
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. GTBank, Access Bank"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePayoutSubmit}
                disabled={payoutLoading || !bankName || !accountNumber || !accountName}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {payoutLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                Submit Request
              </button>
              <button
                onClick={() => setShowPayoutForm(false)}
                className="px-5 py-2.5 rounded-lg border border-border text-muted text-sm hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {affiliate.total_earnings < 10 && !showPayoutForm && (
          <p className="mt-2 text-xs text-muted">
            Minimum payout is $10. You need ${(10 - affiliate.total_earnings).toFixed(2)} more.
          </p>
        )}
      </div>

      {/* Share Templates */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-4">Share Templates</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-success" />
              <h4 className="font-medium text-text">WhatsApp Message</h4>
            </div>
            <p className="text-sm text-muted mb-4 p-3 rounded-lg bg-surface2">
              {whatsappTemplate}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                onClick={() => handleCopyTemplate(whatsappTemplate, 'whatsapp')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-text transition-colors"
              >
                {copiedTemplate === 'whatsapp' ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                Copy
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-text" />
              <h4 className="font-medium text-text">Tweet</h4>
            </div>
            <p className="text-sm text-muted mb-4 p-3 rounded-lg bg-surface2">
              {tweetTemplate}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 border border-border transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Tweet
              </button>
              <button
                onClick={() => handleCopyTemplate(tweetTemplate, 'tweet')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-text transition-colors"
              >
                {copiedTemplate === 'tweet' ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
