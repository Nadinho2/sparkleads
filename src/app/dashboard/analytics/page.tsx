'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Send, FileText, Zap, RefreshCw, Printer,
  Search, MessageCircle, Clock, AlertTriangle, Briefcase, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  leads: {
    totalSearches: number;
    totalLeadsFound: number;
    avgLeadsPerSearch: number;
    topSearchQueries: { query: string; count: number }[];
    leadsByDay: { date: string; count: number }[];
  };
  outreach: {
    totalSent: number;
    whatsappSent: number;
    emailSent: number;
    aiMessages: number;
    outreachByDay: { date: string; count: number }[];
  };
  content: {
    totalGenerated: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
  };
  credits: {
    totalSpent: number;
    totalPurchased: number;
    currentBalance: number;
    spendByFeature: { feature: string; amount: number }[];
    spendByDay: { date: string; amount: number }[];
  };
  reminders: {
    total: number;
    pending: number;
    done: number;
    overdue: number;
  };
  proposals: {
    total: number;
    sent: number;
    accepted: number;
    conversionRate: number;
  };
  briefs: {
    total: number;
    draft: number;
    inProduction: number;
    completed: number;
  };
  activity: { type: string; description: string; time: string }[];
}

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7'];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const activityIcons: Record<string, typeof Search> = {
  search: Search,
  outreach: Send,
  message: MessageCircle,
  proposal: FileText,
  brief: Briefcase,
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/overview?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Leads Found', value: data.leads.totalLeadsFound, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Searches', value: data.leads.totalSearches, icon: Search, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Outreach Sent', value: data.outreach.totalSent, icon: Send, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Content', value: data.content.totalGenerated, icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Proposals', value: data.proposals.total, icon: Briefcase, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Credits Used', value: data.credits.totalSpent, icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const outreachPie = [
    { name: 'WhatsApp', value: data.outreach.whatsappSent },
    { name: 'Email', value: data.outreach.emailSent },
    { name: 'AI Messages', value: data.outreach.aiMessages },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">Analytics</h1>
          <p className="text-sm text-muted">Performance overview for your account</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface2 rounded-lg p-0.5 border border-border">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.value ? 'bg-primary text-white' : 'text-muted hover:text-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={loadAnalytics} className="p-2 rounded-lg bg-surface2 text-muted hover:text-text transition-colors" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => window.print()} className="p-2 rounded-lg bg-surface2 text-muted hover:text-text transition-colors no-print" title="Export / Print">
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="p-4 rounded-xl border border-border bg-surface">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon size={16} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-text">{formatNumber(card.value)}</p>
            <p className="text-xs text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Leads over time */}
        <div className="lg:col-span-3 p-5 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-semibold text-text mb-4">Leads Found Over Time</h3>
          {data.leads.leadsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.leads.leadsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted text-center py-10">No data for this period</p>
          )}
        </div>

        {/* Outreach breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-semibold text-text mb-4">Outreach Breakdown</h3>
          {outreachPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={outreachPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {outreachPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted text-center py-10">No outreach data</p>
          )}
        </div>
      </div>

      {/* Top Searches + Credit Usage */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Searches */}
        <div className="p-5 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-semibold text-text mb-4">Top Search Queries</h3>
          {data.leads.topSearchQueries.length > 0 ? (
            <div className="space-y-2">
              {data.leads.topSearchQueries.map((q, i) => {
                const max = data.leads.topSearchQueries[0].count;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted w-4">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-xs text-text mb-1">{q.query}</p>
                      <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(q.count / max) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted font-mono">{q.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted text-center py-10">No searches yet</p>
          )}
        </div>

        {/* Credit Usage by Feature */}
        <div className="p-5 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-semibold text-text mb-4">Credit Usage by Feature</h3>
          {data.credits.spendByFeature.length > 0 ? (
            <div className="space-y-2">
              {data.credits.spendByFeature.map((f, i) => {
                const max = data.credits.spendByFeature[0].amount;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted w-4">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-xs text-text mb-1 truncate">{f.feature}</p>
                      <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${(f.amount / max) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted font-mono">{f.amount}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted text-center py-10">No credit usage</p>
          )}
        </div>
      </div>

      {/* Proposals Pipeline */}
      <div className="p-5 rounded-2xl border border-border bg-surface">
        <h3 className="text-sm font-semibold text-text mb-4">Proposals Pipeline</h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{data.leads.totalLeadsFound}</p>
              <p className="text-xs text-muted">Leads Found</p>
            </div>
            <span className="text-muted text-lg">→</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{data.outreach.totalSent}</p>
              <p className="text-xs text-muted">Contacted</p>
            </div>
            <span className="text-muted text-lg">→</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{data.proposals.sent}</p>
              <p className="text-xs text-muted">Proposals Sent</p>
            </div>
            <span className="text-muted text-lg">→</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{data.proposals.accepted}</p>
              <p className="text-xs text-muted">Accepted</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-primary">
              Acceptance rate: <span className="font-bold">{data.proposals.conversionRate}%</span>
              {data.proposals.conversionRate >= 20 ? ' — Above average!' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Reminders + Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reminders */}
        <div className="p-5 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-semibold text-text mb-4">Follow-up Reminders</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
              <p className="text-xl font-bold text-yellow-400">{data.reminders.pending}</p>
              <p className="text-xs text-muted">Pending</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-xl font-bold text-green-400">{data.reminders.done}</p>
              <p className="text-xs text-muted">Done</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-center">
              <p className="text-xl font-bold text-red-400">{data.reminders.overdue}</p>
              <p className="text-xs text-muted">Overdue</p>
            </div>
          </div>
          {data.reminders.overdue > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle size={12} />
              You have {data.reminders.overdue} overdue follow-up{data.reminders.overdue > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Content Platform Breakdown */}
        <div className="p-5 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-semibold text-text mb-4">Content by Platform</h3>
          {Object.keys(data.content.byPlatform).length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(data.content.byPlatform).map(([platform, count]) => (
                <div key={platform} className="p-3 rounded-lg bg-surface2 text-center">
                  <p className="text-lg font-bold text-text">{count}</p>
                  <p className="text-xs text-muted">{platform}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted text-center py-6">No content generated yet</p>
          )}
        </div>
      </div>

      {/* Briefs Stats */}
      <div className="p-5 rounded-2xl border border-border bg-surface">
        <h3 className="text-sm font-semibold text-text mb-4">Creative Briefs</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-surface2 text-center">
            <p className="text-xl font-bold text-text">{data.briefs.total}</p>
            <p className="text-xs text-muted">Total</p>
          </div>
          <div className="p-3 rounded-lg bg-surface2 text-center">
            <p className="text-xl font-bold text-muted">{data.briefs.draft}</p>
            <p className="text-xs text-muted">Draft</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-xl font-bold text-yellow-400">{data.briefs.inProduction}</p>
            <p className="text-xs text-muted">In Production</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-xl font-bold text-green-400">{data.briefs.completed}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="p-5 rounded-2xl border border-border bg-surface">
        <h3 className="text-sm font-semibold text-text mb-4">Recent Activity</h3>
        {data.activity.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.activity.map((act, i) => {
              const Icon = activityIcons[act.type] || Clock;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface2 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-surface2 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-muted" />
                  </div>
                  <p className="text-xs text-text flex-1">{act.description}</p>
                  <span className="text-[10px] text-muted flex-shrink-0">{timeAgo(act.time)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted text-center py-6">No recent activity</p>
        )}
      </div>

      {/* Credits Summary */}
      <div className="p-5 rounded-2xl border border-border bg-surface">
        <h3 className="text-sm font-semibold text-text mb-4">Credit Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-xl font-bold text-green-400">{data.credits.totalPurchased}</p>
            <p className="text-xs text-muted">Purchased</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-xl font-bold text-red-400">{data.credits.totalSpent}</p>
            <p className="text-xs text-muted">Spent</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-xl font-bold text-blue-400">{data.credits.currentBalance}</p>
            <p className="text-xs text-muted">Balance</p>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-surface, .bg-surface2 { background: white !important; }
          .border-border { border-color: #ddd !important; }
          .text-text { color: black !important; }
          .text-muted { color: #666 !important; }
        }
      `}</style>
    </div>
  );
}
