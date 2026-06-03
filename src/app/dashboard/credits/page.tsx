'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Zap, History, Check, MessageCircle, Mail, Search, Sparkles, Megaphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

const isFreeAccess = process.env.NEXT_PUBLIC_FREE_ACCESS === 'true';

const creditPacks = [
  { id: 'starter', name: 'Starter', credits: 50, price: 6600, currency: 'NGN', description: '50 credits — great for testing', popular: false },
  { id: 'growth', name: 'Growth', credits: 150, price: 13300, currency: 'NGN', description: '150 credits — best value', popular: true },
  { id: 'pro', name: 'Pro', credits: 500, price: 33200, currency: 'NGN', description: '500 credits — for power users', popular: false },
  { id: 'mega', name: 'Mega', credits: 1000, price: 59700, currency: 'NGN', description: '1000 credits — for agencies', popular: false },
];

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  balance_after: number;
  created_at: string;
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(0);
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      setBalance(Number(data.balance || 0));
      setTotalPurchased(Number(data.total_purchased || 0));
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load credits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    try {
      if (isFreeAccess) {
        const res = await fetch('/api/credits/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pack: packId }),
        });
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
          toast.success(`Added ${creditPacks.find((p) => p.id === packId)?.credits} credits!`);
          loadCredits();
        } else {
          toast.error(data.error || 'Failed to add credits');
        }
      } else {
        const res = await fetch('/api/credits/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pack: packId }),
        });
        const data = await res.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          toast.error(data.error || 'Failed to initialize payment');
        }
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      toast.error('Something went wrong');
    } finally {
      setPurchasing(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference');
    if (ref) {
      fetch('/api/credits/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setBalance(data.balance);
            toast.success(`${data.credits_added} credits added to your account!`);
            loadCredits();
            window.history.replaceState({}, '', '/dashboard/credits');
          } else {
            toast.error(data.error || 'Payment verification failed');
          }
        })
        .catch(() => toast.error('Failed to verify payment'));
    }
  }, [loadCredits]);

  const usageStats = transactions.filter((tx) => tx.amount < 0);
  const totalUsed = usageStats.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const balanceColor = balance === 0 ? 'text-red-400' : balance < 10 ? 'text-yellow-400' : 'text-green-400';
  const balanceBg = balance === 0 ? 'bg-red-500/10 border-red-500/20' : balance < 10 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20';

  return (
    <div className="space-y-8">
      <div className={`p-6 rounded-xl border ${balanceBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
              <Zap className={`w-6 h-6 ${balanceColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Credit Balance</h2>
              <p className="text-sm text-muted">{totalPurchased} total purchased</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl sm:text-5xl font-bold text-right ${balanceColor}`}>{balance}</div>
            <p className="text-sm text-muted">credits remaining</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-border bg-surface">
        <h3 className="text-lg font-semibold text-text mb-4">How Credits Work</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">1 credit = 1 WhatsApp</p>
              <p className="text-xs text-muted mt-1">Send a personalized WhatsApp message</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">1 credit = 1 Email</p>
              <p className="text-xs text-muted mt-1">Send a personalized email to a lead</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">3 credits = Content Gen</p>
              <p className="text-xs text-muted mt-1">Generate 5 social media variations</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">5 credits = Ad Plan</p>
              <p className="text-xs text-muted mt-1">Full AI ad campaign strategy</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Search className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text">Search = Free</p>
            <p className="text-xs text-muted mt-1">Searching for leads is always free and unlimited. Only outreach, content generation, and ad plans cost credits.</p>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="p-6 rounded-xl border border-border bg-surface">
          <h3 className="text-lg font-semibold text-text mb-4">Usage This Month</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className="text-2xl font-bold text-danger">{totalUsed}</div>
              <p className="text-xs text-muted mt-1">Credits used</p>
            </div>
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className={`text-2xl font-bold ${balanceColor}`}>{balance}</div>
              <p className="text-xs text-muted mt-1">Remaining</p>
            </div>
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className="text-2xl font-bold text-primary">{totalPurchased}</div>
              <p className="text-xs text-muted mt-1">Total purchased</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Top Up Credits</h3>
          {isFreeAccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Free Access Mode — No payment required
            </span>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative p-6 rounded-xl border bg-surface hover:border-primary/50 transition-all duration-300 ${
                pack.popular ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-border'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                  Best Value
                </div>
              )}
              <h4 className="text-lg font-semibold text-text">{pack.name}</h4>
              <div className="mt-2">
                <span className="text-3xl font-bold text-text">{isFreeAccess ? 'Free' : `₦${pack.price.toLocaleString()}`}</span>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">{pack.credits} credits</p>
              <p className="text-sm text-muted mt-2">{pack.description}</p>
              <button
                onClick={() => handlePurchase(pack.id)}
                disabled={purchasing === pack.id}
                className="w-full mt-4 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchasing === pack.id ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    {isFreeAccess ? <RefreshCw className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    {isFreeAccess ? `Get ${pack.credits} Credits` : `Buy ${pack.credits} Credits`}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted" />
          <h3 className="text-lg font-semibold text-text">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                    {tx.amount > 0 ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Zap className="w-4 h-4 text-danger" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-text">{tx.description}</p>
                    <p className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-xs text-muted">Balance: {tx.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
