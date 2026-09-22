'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Banknote,
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
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'wise' | 'bank_wire'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [wiseAccount, setWiseAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = affiliate ? `${appUrl}/?ref=${affiliate.referral_code}` : '';

  const whatsappTemplate = affiliate
    ? `Hey! I've been using SparkLeads to find high-intent business leads and it's incredible. You can search any business type in any city worldwide and get real verified emails, phone numbers, and automated outreach sequences. Check it out: ${referralLink}`
    : '';

  const tweetTemplate = affiliate
    ? `I've been using @SparkLeads to find 200+ verified B2B leads in 60 seconds with automated multi-step cold outreach — starting at only $19/mo. Check it out: ${referralLink}`
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
    if (!affiliate) return;

    let finalBankName = '';
    let finalAccountNumber = '';

    if (payoutMethod === 'paypal') {
      if (!paypalEmail || !accountName) return;
      finalBankName = 'PayPal';
      finalAccountNumber = paypalEmail;
    } else if (payoutMethod === 'wise') {
      if (!wiseAccount || !accountName) return;
      finalBankName = 'Wise';
      finalAccountNumber = wiseAccount;
    } else {
      if (!bankName || !accountNumber || !accountName) return;
      finalBankName = swiftCode ? `${bankName} (SWIFT: ${swiftCode})` : bankName;
      finalAccountNumber = accountNumber;
    }

    setPayoutLoading(true);
    try {
      const response = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: affiliate.total_earnings,
          bank_name: finalBankName,
          account_number: finalAccountNumber,
          account_name: accountName,
        }),
      });

      if (response.ok) {
        setPayoutSuccess(true);
        setShowPayoutForm(false);
        setBankName('');
        setSwiftCode('');
        setAccountNumber('');
        setAccountName('');
        setPaypalEmail('');
        setWiseAccount('');

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
  }, [affiliate, payoutMethod, paypalEmail, wiseAccount, bankName, swiftCode, accountNumber, accountName]);

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
              <Banknote className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">${affiliate.total_earnings.toLocaleString()}</p>
          <p className="text-sm text-muted">Total Earnings</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">${affiliate.pending_payout.toLocaleString()}</p>
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
              <Banknote className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-text mb-1">Get paid</h4>
            <p className="text-sm text-muted">Earn 20% recurring revenue every month for every active subscriber.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-4 h-4" />
            20% recurring commission = $3.80 - $39.80/mo per subscriber
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
            Global monthly payouts (PayPal, Wise, Bank Wire)
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
                    ${Number(payout.amount).toLocaleString()} ({payout.bank_name})
                  </p>
                  <p className="text-xs text-muted">{formatDate(payout.created_at)} • To: {payout.account_name}</p>
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
            disabled={affiliate.total_earnings < 50}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Request Payout
          </button>
        ) : (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Select Payout Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('paypal')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    payoutMethod === 'paypal'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface2 text-muted hover:text-text'
                  }`}
                >
                  PayPal
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod('wise')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    payoutMethod === 'wise'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface2 text-muted hover:text-text'
                  }`}
                >
                  Wise
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank_wire')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    payoutMethod === 'bank_wire'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface2 text-muted hover:text-text'
                  }`}
                >
                  Bank Wire / ACH
                </button>
              </div>
            </div>

            {payoutMethod === 'paypal' && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">PayPal Email Address</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your-paypal@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            )}

            {payoutMethod === 'wise' && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Wise Email or Account Tag</label>
                <input
                  type="text"
                  value={wiseAccount}
                  onChange={(e) => setWiseAccount(e.target.value)}
                  placeholder="your-wise@email.com or @handle"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            )}

            {payoutMethod === 'bank_wire' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Chase, Barclays, etc."
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Routing / SWIFT</label>
                    <input
                      type="text"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      placeholder="Routing number or SWIFT"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Account / IBAN Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number or IBAN"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Recipient Full Legal Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Doe or LLC Name"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePayoutSubmit}
                disabled={
                  payoutLoading ||
                  !accountName ||
                  (payoutMethod === 'paypal' && !paypalEmail) ||
                  (payoutMethod === 'wise' && !wiseAccount) ||
                  (payoutMethod === 'bank_wire' && (!bankName || !accountNumber))
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {payoutLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                Submit Payout (${affiliate.total_earnings})
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

        {affiliate.total_earnings < 50 && !showPayoutForm && (
          <p className="mt-2 text-xs text-muted">
            Minimum payout is $50. You need ${(50 - affiliate.total_earnings).toLocaleString()} more to withdraw.
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
