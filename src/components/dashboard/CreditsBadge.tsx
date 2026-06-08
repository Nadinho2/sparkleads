'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useBasePath } from '@/hooks/useBasePath';

export function CreditsBadge() {
  const basePath = useBasePath();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credits/ensure')
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(0));
  }, []);

  if (balance === null) return null;

  const isLow = balance < 5;

  return (
    <Link
      href={`${basePath}/credits`}
      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isLow
          ? 'bg-red-500/10 hover:bg-red-500/20'
          : 'bg-primary/10 hover:bg-primary/20'
      }`}
    >
      <Zap className={`w-4 h-4 ${isLow ? 'text-red-400' : 'text-primary'}`} />
      <span className={`text-sm font-semibold ${isLow ? 'text-red-400' : 'text-text'}`}>
        {balance} credits
      </span>
      {isLow && (
        <span className="text-xs text-red-400 font-medium">Low</span>
      )}
    </Link>
  );
}
