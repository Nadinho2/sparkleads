'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface CreditContextType {
  balance: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CreditContext = createContext<CreditContextType>({
  balance: 0,
  loading: true,
  refresh: async () => {},
});

export function CreditProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits/ensure');
      const data = await res.json();
      setBalance(data.balance ?? 0);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const refresh = useCallback(async () => {
    await fetchCredits();
  }, []);

  return (
    <CreditContext.Provider value={{ balance, loading, refresh }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditContext);
}
