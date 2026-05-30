'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Zap, History, Check } from 'lucide-react';
import { Spinner } from '@/components/ui';

const isFreeAccess = process.env.NEXT_PUBLIC_FREE_ACCESS === 'true';

const creditPacks = [
  { id: 'starter', name: 'Starter', credits: 50, price: 5, description: '50 outreach emails' },
  { id: 'growth', name: 'Growth', credits: 150, price: 10, description: '150 outreach emails', popular: true },
  { id: 'pro', name: 'Pro', credits: 500, price: 25, description: '500 outreach emails' },
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
      const sessionId = localStorage.getItem('sparkleads_session_id');
      if (!sessionId) return;

      const res = await fetch(`/api/credits?user_token=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      setBalance(data.balance || 0);
      setTotalPurchased(data.total_purchased || 0);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Credit Balance</h2>
            <p className="text-sm text-muted">{totalPurchased} total purchased</p>
          </div>
        </div>
        <div className="text-4xl font-bold text-text">{balance}</div>
        <p className="text-sm text-muted mt-1">credits remaining</p>
      </div>

      {isFreeAccess ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
          <div className="text-3xl">🚧</div>
          <h3 className="text-lg font-semibold text-text">Purchases coming soon</h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            Credit packs and subscriptions will be available when SparkLeads
            launches publicly. Your 20 welcome credits are active and ready to use.
          </p>
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
