'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';

interface Stats {
  totalClients: number;
  activeClients: number;
  creditsUsed: number;
  memberCount: number;
}

interface MemberBreakdown {
  name: string;
  used: number;
  limit: number;
}

interface Credits {
  total: number;
  used: number;
  remaining: number;
  memberBreakdown: MemberBreakdown[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({ totalClients: 0, activeClients: 0, creditsUsed: 0, memberCount: 0 });
  const [credits, setCredits] = useState<Credits>({ total: 0, used: 0, remaining: 0, memberBreakdown: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/agency/stats').then((r) => r.json()).catch(() => ({})),
      fetch('/api/agency/credits').then((r) => r.json()).catch(() => ({})),
    ]).then(([statsData, creditsData]) => {
      setStats(statsData);
      setCredits(creditsData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const maxCredits = credits.total || 1;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Analytics</h1>

      {/* Business Metrics */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Business Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: stats.totalClients },
            { label: 'Active Clients', value: stats.activeClients },
            { label: 'Team Members', value: stats.memberCount },
            { label: 'Credits Used', value: stats.creditsUsed },
          ].map((m) => (
            <div key={m.label} className="p-4 rounded-xl border border-border bg-surface">
              <p className="text-xs text-muted mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-text">{m.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Credit Health */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4">Credit Health</h2>
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Credits Used</span>
            <span className="text-sm font-medium text-text">{credits.used.toLocaleString()} / {credits.total.toLocaleString()}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface2 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(credits.used / maxCredits) * 100}%` }} />
          </div>
          <p className="text-xs text-muted mt-2">{credits.remaining.toLocaleString()} credits remaining</p>
        </div>
      </section>

      {/* Team Performance */}
      {credits.memberBreakdown.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Team Performance</h2>
          <div className="space-y-3">
            {credits.memberBreakdown.map((m) => {
              const max = m.limit > 0 ? m.limit : credits.total;
              return (
                <div key={m.name} className="p-4 rounded-xl border border-border bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text">{m.name}</span>
                    <span className="text-sm text-muted">{m.used} credits{m.limit > 0 ? ` / ${m.limit}` : ''}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((m.used / max) * 100, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
