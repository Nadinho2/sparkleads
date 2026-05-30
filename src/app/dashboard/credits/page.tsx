'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Zap, History, Check, MessageCircle, Mail, Search } from 'lucide-react';
import { Spinner } from '@/components/ui';

const isFreeAccess = process.env.NEXT_PUBLIC_FREE_ACCESS === 'true';

const creditPacks = [
  { id: 'starter', name: 'Starter', credits: 50, price: 5, description: '50 outreach messages' },
  { id: 'growth', name: 'Growth', credits: 150, price: 10, description: '150 outreach messages', popular: true },
  { id: 'pro', name: 'Pro', credits: 500, price: 25, description: '500 outreach messages' },
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
      const res = await fetch('/api/credits/ensure');
      const data = await res.json();
      setBalance(data.balance || 0);

      const sessionId = localStorage.getItem('sparkleads_session_id');
      if (sessionId) {
        const txRes = await fetch(`/api/credits?user_token=${encodeURIComponent(sessionId)}`);
        const txData = await txRes.json();
        setTotalPurchased(txData.total_purchased || 0);
        setTransactions(txData.transactions || []);
      }
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
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: packId }),
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        loadCredits();
      }
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setPurchasing(null);
    }
  };

  const usageStats = transactions.filter((tx) => tx.amount < 0);
  const whatsappCount = usageStats.filter((tx) => tx.description?.toLowerCase().includes('whatsapp')).length;
  const emailCount = usageStats.filter((tx) => tx.description?.toLowerCase().includes('email')).length;
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
      {/* Balance Card */}
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
            <div className={`text-5xl font-bold ${balanceColor}`}>{balance}</div>
            <p className="text-sm text-muted">credits remaining</p>
          </div>
        </div>
      </div>

      {/* How Credits Work */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h3 className="text-lg font-semibold text-text mb-4">How Credits Work</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">1 credit = 1 WhatsApp</p>
              <p className="text-xs text-muted mt-1">Send a personalized WhatsApp message to a business lead</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">1 credit = 1 Email</p>
              <p className="text-xs text-muted mt-1">Send a personalized email to a business lead</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">Search = Free</p>
              <p className="text-xs text-muted mt-1">Searching for leads is always free and unlimited</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage This Month */}
      {transactions.length > 0 && (
        <div className="p-6 rounded-xl border border-border bg-surface">
          <h3 className="text-lg font-semibold text-text mb-4">Usage This Month</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className="text-2xl font-bold text-green-400">{whatsappCount}</div>
              <p className="text-xs text-muted mt-1">WhatsApp sent</p>
            </div>
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className="text-2xl font-bold text-blue-400">{emailCount}</div>
              <p className="text-xs text-muted mt-1">Emails sent</p>
            </div>
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className="text-2xl font-bold text-danger">{totalUsed}</div>
              <p className="text-xs text-muted mt-1">Credits used</p>
            </div>
            <div className="p-4 rounded-lg bg-surface2 text-center">
              <div className={`text-2xl font-bold ${balanceColor}`}>{balance}</div>
              <p className="text-xs text-muted mt-1">Remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Section */}
      {isFreeAccess ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-4">
          <div className="text-4xl">⚡</div>
          <h3 className="text-xl font-semibold text-text">Credit Top-ups Coming Soon</h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            SparkLeads is currently in private access mode.
            Credit purchases will be available at public launch.
          </p>
          <div className="inline-flex items-center gap-2 bg-surface2 rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-muted">You have <strong className="text-text">{balance} credits</strong> available</span>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-text mb-4">Buy Credits</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative p-6 rounded-xl border bg-surface ${
                  pack.popular ? 'border-primary' : 'border-border'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                    Popular
                  </div>
                )}
                <h4 className="text-lg font-semibold text-text">{pack.name}</h4>
                <div className="text-3xl font-bold text-text mt-2">${pack.price}</div>
                <p className="text-sm text-muted mt-1">{pack.description}</p>
                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing === pack.id}
                  className="w-full mt-4 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchasing === pack.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Buy {pack.credits} Credits
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
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
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-success/10' : 'bg-danger/10'
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Zap className="w-4 h-4 text-danger" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-text">{tx.description}</p>
                    <p className="text-xs text-muted">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      tx.amount > 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
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
