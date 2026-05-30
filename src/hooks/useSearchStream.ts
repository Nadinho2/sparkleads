'use client';

import { useState, useCallback, useRef } from 'react';
import type { Lead } from '@/types';

interface UseSearchStreamOptions {
  sessionId: string;
  isPaid: boolean;
}

interface UseSearchStreamReturn {
  leads: Lead[];
  isSearching: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  reset: () => void;
}

export function useSearchStream({
  sessionId,
  isPaid,
}: UseSearchStreamOptions): UseSearchStreamReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setLeads([]);
    setError(null);
    setIsSearching(false);
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setLeads([]);
      setError(null);
      setIsSearching(true);

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, sessionId, isPaid }),
          signal: abortControllerRef.current.signal,
        });

        if (response.status === 403) {
          const data = await response.json();
          if (data.error === 'free_limit_reached') {
            setError('free_limit_reached');
            setIsSearching(false);
            return;
          }
        }

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Search failed');
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'email_found') {
                setLeads((prev) =>
                  prev.map((lead) =>
                    lead.id === parsed.lead_id
                      ? { ...lead, email: parsed.email }
                      : lead
                  )
                );
              } else if (parsed.type === 'error') {
                setError(parsed.error);
              } else if (parsed.id) {
                setLeads((prev) => [...prev, parsed as Lead]);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsSearching(false);
      }
    },
    [sessionId, isPaid]
  );

  return { leads, isSearching, error, search, reset };
}
