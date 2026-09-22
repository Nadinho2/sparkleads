'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Phone,
  Mail,
  MapPin,
  Send,
  FileText,
  CheckCircle2,
  ExternalLink,
  Plus,
  Save,
} from 'lucide-react';
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

interface Campaign {
  id: string;
  name: string;
  status: string;
  client_id?: string;
  steps_count?: number;
  created_at?: string;
}

interface Proposal {
  id: string;
  business_name: string;
  status: string;
  created_at: string;
  pricing?: { price: number; currency: string }[];
  proposal_data?: any;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/agency/clients/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data.client || null);
        setCampaigns(data.campaigns || []);
        setProposals(data.proposals || []);
        setNotesText(data.client?.notes || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleSaveNotes = async () => {
    if (!client) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/agency/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2500);
      }
    } catch {
      // Non-fatal
    } finally {
      setSavingNotes(false);
    }
  };

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
          <p className="text-sm text-muted">{client.business_type || 'Client'}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full capitalize font-semibold ${
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
        <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Monthly Retainer</p>
            <p className="text-2xl font-bold text-green-400">{client.currency || '$'} {client.monthly_retainer.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted">Next billing scheduled</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'leads', label: `Outreach Campaigns (${campaigns.length})` },
          { id: 'proposals', label: `Proposals (${proposals.length})` },
          { id: 'notes', label: 'CRM Notes' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[220px]">
        {tab === 'overview' && (
          <div className="space-y-4">
            {client.contact_person && (
              <p className="text-sm text-text">
                <span className="text-muted">Primary Contact:</span> {client.contact_person}
              </p>
            )}
            {client.notes ? (
              <div className="p-4 rounded-xl bg-surface2 border border-border">
                <p className="text-xs font-semibold text-muted uppercase mb-1">Notes</p>
                <p className="text-sm text-text whitespace-pre-wrap">{client.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted italic">No internal notes added yet.</p>
            )}
            <p className="text-xs text-muted">Added {new Date(client.created_at).toLocaleDateString()}</p>
          </div>
        )}

        {tab === 'leads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Cold email outreach sequences attached to {client.name}</p>
              <button
                onClick={() => router.push('/dashboard/outreach')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90"
              >
                <Plus size={14} /> New Sequence
              </button>
            </div>

            {campaigns.length > 0 ? (
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between hover:bg-surface2/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Send size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text">{c.name}</h4>
                        <p className="text-xs text-muted">
                          {c.steps_count ? `${c.steps_count} sequence steps` : 'Active sequence'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400 capitalize">
                        {c.status || 'Active'}
                      </span>
                      <button
                        onClick={() => router.push('/dashboard/outreach')}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Manage <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface2/30">
                <Send className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text font-medium">No sequences assigned yet</p>
                <p className="text-xs text-muted mt-1 mb-4">
                  Enroll leads into a cold email sequence for {client.name} from the Search page or Outreach Dashboard.
                </p>
                <button
                  onClick={() => router.push('/dashboard/outreach')}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
                >
                  Go to Sequences
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'proposals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Proposals prepared for {client.name}</p>
              <button
                onClick={() => router.push('/agency/proposals/new')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90"
              >
                <Plus size={14} /> Create Proposal
              </button>
            </div>

            {proposals.length > 0 ? (
              <div className="space-y-2">
                {proposals.map((pr) => {
                  const total = pr.pricing?.reduce((acc, cur) => acc + (cur.price || 0), 0) || 0;
                  const isAccepted = pr.status === 'accepted';
                  return (
                    <div
                      key={pr.id}
                      className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between hover:bg-surface2/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-text">{pr.business_name}</h4>
                            {isAccepted && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                                <CheckCircle2 size={12} /> Accepted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted">
                            {new Date(pr.created_at).toLocaleDateString()} {total > 0 ? `• $${total.toLocaleString()}` : ''}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/print/proposal/${pr.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface2 border border-border"
                      >
                        View & Sign <ExternalLink size={12} />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface2/30">
                <FileText className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text font-medium">No proposals prepared yet</p>
                <p className="text-xs text-muted mt-1 mb-4">
                  Draft a personalized AI proposal with scope of work and deliverables.
                </p>
                <button
                  onClick={() => router.push('/agency/proposals/new')}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
                >
                  Create Proposal
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-medium text-muted mb-2">
                Internal CRM Notes & Account History
              </label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={6}
                placeholder="Log meetings, contract milestones, retainer terms, or special preferences..."
                className="w-full p-3 rounded-xl border border-border bg-surface2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {savingNotes ? <Spinner size="sm" /> : <Save size={16} />}
                Save Notes
              </button>
              {notesSaved && (
                <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={14} /> Saved successfully!
                </span>
              )}
            </div>
          </div>
        )}
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
