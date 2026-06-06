'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { Spinner } from '@/components/ui';

interface Client {
  id: string;
  name: string;
  business_type: string;
  location: string;
  website: string;
  phone: string;
  email: string;
  contact_person: string;
  status: string;
  monthly_retainer: number;
  currency: string;
  assigned_to: string;
  notes: string;
  created_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', businessType: '', location: '', website: '',
    phone: '', email: '', contactPerson: '', monthlyRetainer: 0,
    notes: '', status: 'prospect',
  });
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    const url = filter ? `/api/agency/clients?status=${filter}` : '/api/agency/clients';
    const res = await fetch(url);
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/agency/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: '', businessType: '', location: '', website: '', phone: '', email: '', contactPerson: '', monthlyRetainer: 0, notes: '', status: 'prospect' });
        loadClients();
      }
    } catch { /* silent */ }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Clients</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['', 'prospect', 'active', 'paused', 'churned'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-surface2 text-muted hover:text-text'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Client Table */}
      <div className="rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              {['Name', 'Type', 'Status', 'Retainer', 'Assigned', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-surface2/50 cursor-pointer" onClick={() => router.push(`/agency/clients/${c.id}`)}>
                <td className="px-4 py-3 text-sm font-medium text-text">{c.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{c.business_type || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    c.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    c.status === 'prospect' ? 'bg-blue-500/20 text-blue-400' :
                    c.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted">{c.monthly_retainer > 0 ? `${c.currency} ${c.monthly_retainer.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-muted">{c.assigned_to || '—'}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-primary hover:underline">View</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">No clients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text">Add Client</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted hover:text-text"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Business Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Business Type</label>
                  <input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Website</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Monthly Retainer</label>
                  <input type="number" value={form.monthlyRetainer} onChange={(e) => setForm({ ...form, monthlyRetainer: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
