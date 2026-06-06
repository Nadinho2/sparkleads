'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Spinner } from '@/components/ui';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  credit_limit: number;
  credits_used: number;
  status: string;
  joined_at: string | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLimit, setInviteLimit] = useState(0);
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [seatsInfo, setSeatsInfo] = useState({ used: 0, limit: 3 });

  const loadMembers = async () => {
    const res = await fetch('/api/agency/members');
    const data = await res.json();
    setMembers(data.members || []);
    setSeatsInfo({ used: data.members?.length || 0, limit: data.seatsLimit || 3 });
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch('/api/agency/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, creditLimit: inviteLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(data.inviteLink);
        setInviteEmail('');
        loadMembers();
      }
    } catch { /* silent */ }
    setInviting(false);
  };

  const updateMember = async (memberId: string, updates: Record<string, unknown>) => {
    await fetch('/api/agency/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, ...updates }),
    });
    loadMembers();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Team Members</h1>
          <p className="text-sm text-muted">{seatsInfo.used} of {seatsInfo.limit} seats used</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Invite Member
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">Credits Used</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="px-4 py-3 text-sm font-medium text-text">{m.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{m.email}</td>
                <td className="px-4 py-3">
                  <select value={m.role} onChange={(e) => updateMember(m.id, { role: e.target.value })} className="bg-transparent border border-border rounded-lg px-2 py-1 text-xs text-text">
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-muted">{m.credits_used}{m.credit_limit > 0 ? ` / ${m.credit_limit}` : ''}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'active' ? 'bg-green-500/20 text-green-400' : m.status === 'invited' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateMember(m.id, { status: m.status === 'suspended' ? 'active' : 'suspended' })} className="text-xs text-muted hover:text-text">
                      {m.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowInvite(false); setInviteLink(''); }}>
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text">Invite Team Member</h3>
              <button onClick={() => { setShowInvite(false); setInviteLink(''); }} className="text-muted hover:text-text"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@email.com" className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Role</label>
                <div className="flex gap-3">
                  {['manager', 'member'].map((r) => (
                    <button key={r} onClick={() => setInviteRole(r)} className={`flex-1 py-2 rounded-lg border text-sm font-medium ${inviteRole === r ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface2 text-muted'}`}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Credit Limit (0 = unlimited)</label>
                <input type="number" value={inviteLimit} onChange={(e) => setInviteLimit(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {inviting ? <Spinner size="sm" /> : 'Send Invite'}
              </button>
              {inviteLink && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm break-all">
                  Invite link: {inviteLink}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
