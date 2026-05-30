'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export function CreditsBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credits/ensure')
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(0));
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href="/dashboard/credits"
      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm text-primary hover:bg-primary/20 transition-colors"
    >
      <Zap className="w-4 h-4" />
      <span className="font-medium">{balance}</span>
      <span className="text-primary/70">credits</span>
    </Link>
  );
}
