'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCircle, Check, Copy, CheckCircle, MessageCircle, Send, ClipboardCopy } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { toast } from 'sonner';

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

interface PendingInvite {
  id: string;
  invite_token: string;
  role: string;
  name: string;
  credit_limit: number;
  created_at: string;
}

interface GeneratedInvite {
  inviteLink: string;
  inviteToken: string;
  expiresAt: string;
  role: string;
  creditLimit: number;
}

function timeAgo(dateStr: string, future = false) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = future
    ? date.getTime() - now.getTime()
    : now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return future ? 'soon' : 'just now';
  if (mins < 60) return `${mins}m${future ? ' remaining' : ' ago'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h${future ? ' remaining' : ' ago'}`;
  const days = Math.floor(hours / 24);
  return `${days}d${future ? ' remaining' : ' ago'}`;
}

function getInviteExpiryDate(createdAt: string) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatsInfo, setSeatsInfo] = useState({ used: 0, limit: 3 });

  // Invite form state
  const [inviteRole, setInviteRole] = useState<'manager' | 'member'>('member');
  const [creditLimit, setCreditLimit] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<GeneratedInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/agency/members'),
        fetch('/api/agency/team/invites'),
      ]);
      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();

      setMembers(membersData.members || []);
      setSeatsInfo({ used: (membersData.members || []).filter((m: Member) => m.status === 'active').length, limit: membersData.seatsLimit || 3 });
      setPendingInvites(invitesData.invites || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateInviteLink = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/agency/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole, creditLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedInvite(data);
        loadData();
      } else {
        toast.error(data.message || data.error || 'Failed to generate invite');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setIsGenerating(false);
  };

  const revokeInvite = async (inviteToken: string) => {
    try {
      const res = await fetch(`/api/agency/team/invites?token=${inviteToken}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Invite revoked');
        loadData();
      }
    } catch { /* silent */ }
  };

  const updateMember = async (memberId: string, updates: Record<string, unknown>) => {
    await fetch('/api/agency/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, ...updates }),
    });
    loadData();
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Team Members</h1>
        <p className="text-sm text-muted">{seatsInfo.used} of {seatsInfo.limit} seats used</p>
      </div>

      {/* Invite Section */}
      <div className="rounded-xl bg-surface border border-border p-6">
        <h3 className="font-semibold text-text mb-1">Invite Team Member</h3>
        <p className="text-sm text-muted mb-4">
          Generate a link and send it via WhatsApp, Telegram, or any app you use.
          Link expires in 7 days.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Role selector */}
          <div>
            <label className="text-xs text-muted mb-2 block">Role</label>
            <div className="flex gap-2">
              {(['member', 'manager'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    inviteRole === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Credit limit */}
          <div>
            <label className="text-xs text-muted mb-2 block">
              Monthly Credit Limit (0 = no limit)
            </label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 rounded-lg bg-surface2 border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <button
          onClick={generateInviteLink}
          disabled={isGenerating}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <><Spinner size="sm" /> Generating...</>
          ) : (
            <><UserPlus size={16} /> Generate Invite Link</>
          )}
        </button>
      </div>

      {/* Generated Invite Display */}
      {generatedInvite && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-green-400" />
            <p className="font-semibold text-green-400">Invite link ready</p>
            <span className="text-xs text-muted ml-auto">Expires in 7 days</span>
          </div>

          {/* Link display */}
          <div className="flex items-center gap-2 bg-surface rounded-lg p-3 border border-border mb-4">
            <code className="text-xs text-muted flex-1 truncate">
              {generatedInvite.inviteLink}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedInvite.inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium"
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
            </button>
          </div>

          {/* Share buttons */}
          <div className="space-y-2">
            <p className="text-xs text-muted font-medium">Send via:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  const message = encodeURIComponent(
                    `Hi! You've been invited to join our team on SparkLeads as a ${generatedInvite.role}.\n\nClick this link to set up your account:\n${generatedInvite.inviteLink}\n\nThe link expires in 7 days.`
                  );
                  window.open(`https://wa.me/?text=${message}`, '_blank');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
              >
                <MessageCircle size={15} /> WhatsApp
              </button>

              <button
                onClick={() => {
                  const message = encodeURIComponent(
                    `You've been invited to SparkLeads. Join here: ${generatedInvite.inviteLink}`
                  );
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(generatedInvite.inviteLink)}&text=${message}`, '_blank');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
              >
                <Send size={15} /> Telegram
              </button>

              <button
                onClick={() => {
                  const message = `Hi! You've been invited to join our team on SparkLeads as a ${generatedInvite.role}.\n\nClick this link to set up your account:\n${generatedInvite.inviteLink}\n\nThe link expires in 7 days.`;
                  navigator.clipboard.writeText(message);
                  toast.success('Full message copied — paste it anywhere');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 hover:bg-surface text-muted hover:text-text text-sm transition-colors border border-border"
              >
                <ClipboardCopy size={15} /> Copy Full Message
              </button>
            </div>
          </div>

          {/* Info and dismiss */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted">
            <span>Role: <strong className="text-text capitalize">{generatedInvite.role}</strong></span>
            <span>Credits: <strong className="text-text">{generatedInvite.creditLimit === 0 ? 'No limit' : `${generatedInvite.creditLimit}/month`}</strong></span>
            <button onClick={() => setGeneratedInvite(null)} className="ml-auto text-muted hover:text-text">Dismiss</button>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="rounded-xl bg-surface border border-border p-4">
          <p className="text-sm font-semibold text-text mb-3">
            Pending Invites ({pendingInvites.length})
          </p>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                    <UserCircle size={18} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-sm text-text capitalize">{invite.role} invite</p>
                    <p className="text-xs text-muted">
                      Created {timeAgo(invite.created_at)} · Expires {timeAgo(getInviteExpiryDate(invite.created_at), true)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(
                        `Reminder: You've been invited to join SparkLeads.\n\nJoin here: ${appUrl}/join?token=${invite.invite_token}`
                      );
                      window.open(`https://wa.me/?text=${message}`, '_blank');
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => revokeInvite(invite.invite_token)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Active Members</h2>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Role', 'Credits Used', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.filter((m) => m.status === 'active').map((m) => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-sm font-medium text-text">{m.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => updateMember(m.id, { role: e.target.value })}
                      className="bg-transparent border border-border rounded-lg px-2 py-1 text-xs text-text"
                    >
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{m.credits_used}{m.credit_limit > 0 ? ` / ${m.credit_limit}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">active</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateMember(m.id, { status: m.status === 'suspended' ? 'active' : 'suspended' })} className="text-xs text-muted hover:text-text">
                      {m.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
              {members.filter((m) => m.status === 'active').length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">No active members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {members.filter((m) => m.status === 'active').length === 0 && (
            <p className="text-sm text-muted text-center py-4">No active members yet.</p>
          )}
          {members.filter((m) => m.status === 'active').map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text">{m.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">active</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted mb-3">
                <div>
                  <span className="block text-muted">Role</span>
                  <select
                    value={m.role}
                    onChange={(e) => updateMember(m.id, { role: e.target.value })}
                    className="bg-surface2 border border-border rounded-lg px-2 py-1 text-xs text-text mt-0.5"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div>
                  <span className="block text-muted">Credits</span>
                  <span className="text-sm font-medium text-text">{m.credits_used}{m.credit_limit > 0 ? ` / ${m.credit_limit}` : ''}</span>
                </div>
              </div>
              <button
                onClick={() => updateMember(m.id, { status: m.status === 'suspended' ? 'active' : 'suspended' })}
                className="text-xs text-red-400 hover:underline"
              >
                {m.status === 'suspended' ? 'Activate' : 'Suspend'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
