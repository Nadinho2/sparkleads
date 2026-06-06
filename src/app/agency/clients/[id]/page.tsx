'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  notes: string;
  created_at: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetch(`/api/agency/clients/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setClient(data.client); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!client) return <div className="text-center py-20 text-muted">Client not found.</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/agency/clients')} className="flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} /> Back to Clients
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{client.name}</h1>
          <p className="text-sm text-muted">{client.business_type}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full capitalize ${
          client.status === 'active' ? 'bg-green-500/20 text-green-400' :
          client.status === 'prospect' ? 'bg-blue-500/20 text-blue-400' :
          client.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>{client.status}</span>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {client.website && <InfoCard icon={<Globe size={16} />} label="Website" value={client.website} />}
        {client.phone && <InfoCard icon={<Phone size={16} />} label="Phone" value={client.phone} />}
        {client.email && <InfoCard icon={<Mail size={16} />} label="Email" value={client.email} />}
        {client.location && <InfoCard icon={<MapPin size={16} />} label="Location" value={client.location} />}
      </div>

      {client.monthly_retainer > 0 && (
        <div className="p-4 rounded-xl border border-border bg-surface">
          <p className="text-sm text-muted">Monthly Retainer</p>
          <p className="text-2xl font-bold text-green-400">{client.currency} {client.monthly_retainer.toLocaleString()}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {['overview', 'leads', 'proposals', 'content', 'notes'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {tab === 'overview' && (
          <div className="space-y-4">
            {client.contact_person && <p className="text-sm text-text"><span className="text-muted">Contact:</span> {client.contact_person}</p>}
            {client.notes && <div className="p-4 rounded-xl bg-surface2"><p className="text-sm text-muted whitespace-pre-wrap">{client.notes}</p></div>}
            <p className="text-xs text-muted">Added {new Date(client.created_at).toLocaleDateString()}</p>
          </div>
        )}
        {tab === 'leads' && <p className="text-sm text-muted">Lead tracking for this client coming soon.</p>}
        {tab === 'proposals' && <p className="text-sm text-muted">Proposal management coming soon.</p>}
        {tab === 'content' && <p className="text-sm text-muted">Content generation for this client coming soon.</p>}
        {tab === 'notes' && <p className="text-sm text-muted">Notes feature coming soon.</p>}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 text-muted mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-sm text-text truncate">{value}</p>
    </div>
  );
}
