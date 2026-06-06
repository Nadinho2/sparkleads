'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, PieChart } from 'lucide-react';
import { Spinner } from '@/components/ui';

interface Client {
  id: string;
  name: string;
  business_type: string;
  status: string;
  monthly_retainer: number;
  assigned_to: string;
  created_at: string;
}

interface Activity {
  id: string;
  member_name: string;
  action: string;
  created_at: string;
}

export default function AgencyOverviewPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, activeClients: 0, leadsThisMonth: 0, creditsUsed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/agency/clients?limit=50').then((r) => r.json()).catch(() => ({ clients: [] })),
      fetch('/api/agency/activity?limit=10').then((r) => r.json()).catch(() => ({ activity: [] })),
      fetch('/api/agency/stats').then((r) => r.json()).catch(() => ({})),
    ]).then(([clientData, activityData, statsData]) => {
      setClients(clientData.clients || []);
      setActivity(activityData.activity || []);
      setStats({
        totalClients: statsData.totalClients || 0,
        activeClients: statsData.activeClients || 0,
        leadsThisMonth: statsData.leadsThisMonth || 0,
        creditsUsed: statsData.creditsUsed || 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const statusGroups = {
    prospect: clients.filter((c) => c.status === 'prospect'),
    active: clients.filter((c) => c.status === 'active'),
    paused: clients.filter((c) => c.status === 'paused'),
    churned: clients.filter((c) => c.status === 'churned'),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: stats.totalClients, icon: <Users size={18} /> },
          { label: 'Active Clients', value: stats.activeClients, icon: <Users size={18} /> },
          { label: 'Leads This Month', value: stats.leadsThisMonth, icon: <Search size={18} /> },
          { label: 'Credits Used', value: stats.creditsUsed, icon: <PieChart size={18} /> },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 text-muted mb-2">{s.icon}<span className="text-xs">{s.label}</span></div>
            <p className="text-2xl font-bold text-text">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: '+ New Search', href: '/agency/search', color: 'bg-primary' },
          { label: '+ New Client', href: '/agency/clients?action=new', color: 'bg-green-600' },
          { label: 'View Reports', href: '/agency/analytics', color: 'bg-surface2 text-text' },
        ].map((a) => (
          <button key={a.label} onClick={() => router.push(a.href)} className={`px-4 py-2.5 rounded-xl text-sm font-medium text-white ${a.color} hover:opacity-90 transition-opacity`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Client Board */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Client Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['prospect', 'active', 'paused', 'churned'] as const).map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted capitalize">{status}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface2 text-muted">{statusGroups[status].length}</span>
              </div>
              {statusGroups[status].map((client) => (
                <div key={client.id} className="p-3 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push(`/agency/clients/${client.id}`)}>
                  <p className="text-sm font-medium text-text">{client.name}</p>
                  <p className="text-xs text-muted mt-1">{client.business_type}</p>
                  {client.monthly_retainer > 0 && (
                    <p className="text-xs text-green-400 mt-1">₦{client.monthly_retainer.toLocaleString()}/mo</p>
                  )}
                </div>
              ))}
              {statusGroups[status].length === 0 && (
                <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted text-center">No clients</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Team Activity</h2>
        <div className="space-y-2">
          {activity.length === 0 ? (
            <p className="text-sm text-muted">No activity yet.</p>
          ) : (
            activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(a.member_name || '?').charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text"><span className="font-medium">{a.member_name}</span> {a.action}</p>
                  <p className="text-xs text-muted">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
