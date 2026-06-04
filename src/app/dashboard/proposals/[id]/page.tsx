'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer, Send, CheckCircle, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface ProposalData {
  subject_line: string;
  opening: string;
  problem_statement: string;
  solution_overview: string;
  services: {
    name: string;
    description: string;
    value_prop: string;
    deliverables: string[];
  }[];
  timeline_overview: string;
  why_us: string[];
  next_steps: string[];
  closing: string;
  ps_line: string;
  agency_name: string;
  agency_contact: string;
  timeline: string;
  total_price: number;
  currency: string;
}

interface Proposal {
  id: string;
  business_name: string;
  services: string[];
  pricing: { service: string; price: number; currency: string }[];
  proposal_data: ProposalData;
  status: string;
  created_at: string;
}

function getCurrencySymbol(currency: string) {
  if (currency === 'NGN') return '₦';
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  return currency;
}

export default function ProposalViewPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proposals/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.proposal) setProposal(d.proposal); })
      .catch(() => toast.error('Failed to load proposal'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateStatus(status: string) {
    try {
      await fetch('/api/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, status }),
      });
      setProposal((p) => p ? { ...p, status } : p);
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Zap className="w-8 h-8 animate-pulse text-primary" /></div>;
  }

  if (!proposal) {
    return <div className="text-center py-20 text-muted">Proposal not found</div>;
  }

  const data = proposal.proposal_data;
  const sym = getCurrencySymbol(data.currency);
  const total = proposal.pricing?.reduce((sum, p) => sum + p.price, 0) || data.total_price;

  return (
    <>
      <style jsx global>{`
        @media print {
          nav, aside, header, .no-print { display: none !important; }
          .proposal-content { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 20px !important; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          .proposal-content * { color: black !important; }
          h1 { font-size: 24pt !important; }
          h2 { font-size: 18pt !important; }
          p, li { font-size: 11pt !important; line-height: 1.6 !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Printer size={16} /> Download PDF
          </button>
          <button onClick={() => updateStatus('sent')} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors">
            <Send size={16} /> Mark as Sent
          </button>
          <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2.5 bg-surface2 text-text border border-border rounded-xl text-sm font-medium hover:bg-surface transition-colors">
            <Copy size={16} /> Copy Link
          </button>
          <div className="ml-auto">
            <select
              value={proposal.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Proposal Content */}
        <div className="proposal-content space-y-8">
          {/* Header */}
          <div className="p-8 rounded-2xl border border-border bg-surface text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-text">{data.agency_name || 'Agency'}</span>
            </div>
            <h1 className="text-2xl font-bold text-text mb-1">Digital Marketing Proposal</h1>
            <p className="text-muted text-sm">
              Prepared for: <span className="text-text font-medium">{proposal.business_name}</span>
            </p>
            <p className="text-muted text-xs mt-1">
              {new Date(proposal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Opening */}
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <p className="text-sm text-text leading-relaxed">Dear {proposal.business_name} team,</p>
            <p className="text-sm text-text leading-relaxed mt-3">{data.opening}</p>
          </div>

          {/* Problem Statement */}
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
            <h2 className="text-lg font-semibold text-text mb-3">The Situation</h2>
            <p className="text-sm text-text leading-relaxed">{data.problem_statement}</p>
          </div>

          {/* Solution Overview */}
          <div className="p-6 rounded-2xl border border-green-500/20 bg-green-500/5">
            <h2 className="text-lg font-semibold text-text mb-3">Our Solution</h2>
            <p className="text-sm text-text leading-relaxed">{data.solution_overview}</p>
          </div>

          {/* Services */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">Services Included</h2>
            <div className="space-y-4">
              {data.services?.map((service, i) => {
                const servicePrice = proposal.pricing?.find((p) => p.service === service.name)?.price;
                return (
                  <div key={i} className="p-6 rounded-2xl border border-border bg-surface">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-text flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {service.name}
                      </h3>
                      {servicePrice !== undefined && servicePrice > 0 && (
                        <span className="text-primary font-bold">{sym}{servicePrice.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted mb-3">{service.description}</p>
                    <p className="text-sm text-text mb-3"><strong>Why you need this:</strong> {service.value_prop}</p>
                    {service.deliverables && service.deliverables.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-2">What&apos;s included:</p>
                        <ul className="space-y-1">
                          {service.deliverables.map((d, j) => (
                            <li key={j} className="text-sm text-text flex items-start gap-2">
                              <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Investment Summary */}
          <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5">
            <h2 className="text-lg font-semibold text-text mb-4">Investment Summary</h2>
            <div className="space-y-2">
              {proposal.pricing?.filter((p) => p.price > 0).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-text">{p.service}</span>
                  <span className="text-sm font-medium text-text">{sym}{p.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-primary/30">
                <span className="font-bold text-text">Total Investment</span>
                <span className="text-xl font-bold text-primary">{sym}{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-semibold text-text mb-3">Timeline</h2>
            <p className="text-sm text-text leading-relaxed">{data.timeline_overview}</p>
          </div>

          {/* Why Us */}
          {data.why_us && data.why_us.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <h2 className="text-lg font-semibold text-text mb-3">Why Choose {data.agency_name}</h2>
              <ul className="space-y-2">
                {data.why_us.map((point, i) => (
                  <li key={i} className="text-sm text-text flex items-start gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {data.next_steps && data.next_steps.length > 0 && (
            <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
              <h2 className="text-lg font-semibold text-text mb-3">Next Steps</h2>
              <div className="space-y-3">
                {data.next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-text pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closing */}
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <p className="text-sm text-text leading-relaxed">{data.closing}</p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-text">{data.agency_name}</p>
              {data.agency_contact && <p className="text-sm text-muted">{data.agency_contact}</p>}
            </div>
          </div>

          {/* P.S. */}
          {data.ps_line && (
            <div className="p-4 rounded-xl border border-border bg-surface2">
              <p className="text-sm text-muted italic">{data.ps_line}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
