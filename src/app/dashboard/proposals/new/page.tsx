'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Loader2, ChevronRight, ChevronLeft, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_SERVICES = [
  'Website Design',
  'Website Redesign',
  'SEO Setup',
  'Google Business Profile Optimization',
  'Social Media Management',
  'Content Creation',
  'Facebook/Instagram Ads Management',
  'WhatsApp Automation',
  'Logo & Branding',
];

const TIMELINE_OPTIONS = ['1 week', '2 weeks', '1 month', '2-3 months', '3-6 months'];

interface AuditReport {
  id: string;
  business_name: string;
  overall_score: number;
  created_at: string;
}

export default function NewProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);

  // Step 1 fields
  const [businessName, setBusinessName] = useState('');
  const [auditReportId, setAuditReportId] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyContact, setAgencyContact] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Step 2 fields
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');
  const [pricing, setPricing] = useState<{ service: string; price: number; currency: string }[]>([]);
  const [timeline, setTimeline] = useState('1 month');
  const [currency, setCurrency] = useState('NGN');

  // Read query params once (pipeline navigation)
  const nameFromParams = searchParams.get('name');
  const auditIdFromParams = searchParams.get('auditId');

  useEffect(() => {
    if (nameFromParams) setBusinessName(decodeURIComponent(nameFromParams));
    if (auditIdFromParams) setAuditReportId(auditIdFromParams);

    // Load audit reports
    fetch('/api/audit/report/history')
      .then((r) => r.json())
      .then((d) => { if (d.reports) setAuditReports(d.reports); })
      .catch(() => {});

    // Load agency profile from settings
    fetch('/api/settings/agency')
      .then((r) => r.json())
      .then((d) => {
        if (d.agencyName) setAgencyName(d.agencyName);
        if (d.agencyContact) setAgencyContact(d.agencyContact);
        if (d.defaultCurrency) setCurrency(d.defaultCurrency);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFromParams, auditIdFromParams]);

  function toggleService(service: string) {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        setPricing((p) => p.filter((x) => x.service !== service));
        return prev.filter((s) => s !== service);
      } else {
        setPricing((p) => [...p, { service, price: 0, currency }]);
        return [...prev, service];
      }
    });
  }

  function addCustomService() {
    if (!customService.trim()) return;
    if (selectedServices.includes(customService.trim())) {
      toast.error('Service already added');
      return;
    }
    setSelectedServices((prev) => [...prev, customService.trim()]);
    setPricing((p) => [...p, { service: customService.trim(), price: 0, currency }]);
    setCustomService('');
  }

  function updatePrice(service: string, price: number) {
    setPricing((prev) => prev.map((p) => p.service === service ? { ...p, price, currency } : p));
  }

  function updateCurrency(newCurrency: string) {
    setCurrency(newCurrency);
    setPricing((prev) => prev.map((p) => ({ ...p, currency: newCurrency })));
  }

  async function handleGenerate() {
    if (!businessName.trim()) { toast.error('Enter a business name'); return; }
    if (!agencyName.trim()) { toast.error('Enter your agency name'); return; }
    if (selectedServices.length === 0) { toast.error('Select at least one service'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          auditReportId: auditReportId || undefined,
          selectedServices,
          pricing,
          agencyName: agencyName.trim(),
          agencyContact: agencyContact.trim(),
          timeline,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to generate proposal');
        }
        return;
      }

      toast.success('Proposal generated!');
      router.push(`/dashboard/proposals/${data.proposalId}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const total = pricing.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Generate Proposal</h1>
        <p className="text-muted">Create a professional agency proposal for your prospect.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-surface2 text-muted'}`}>1</div>
          <span className="text-sm font-medium hidden sm:inline">Business & Agency</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-surface2 text-muted'}`}>2</div>
          <span className="text-sm font-medium hidden sm:inline">Services & Pricing</span>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Business Name *</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Lagos Plumbing Co."
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Link Audit Report (optional)</label>
            <select
              value={auditReportId}
              onChange={(e) => setAuditReportId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">No audit report</option>
              {auditReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.business_name} — Score: {r.overall_score} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Agency Name *</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Your agency name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Your Contact Info</label>
              <input
                type="text"
                value={agencyContact}
                onChange={(e) => setAgencyContact(e.target.value)}
                placeholder="email or phone"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Custom Message (optional)</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Any specific context or notes for the proposal..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          <button
            onClick={() => {
              if (!businessName.trim()) { toast.error('Enter a business name'); return; }
              if (!agencyName.trim()) { toast.error('Enter your agency name'); return; }
              setStep(2);
            }}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            Next: Services & Pricing
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <h3 className="text-sm font-semibold text-text mb-4">Select Services to Offer</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {AVAILABLE_SERVICES.map((service) => (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm text-left transition-colors ${
                    selectedServices.includes(service)
                      ? 'bg-primary/10 border-primary text-primary border'
                      : 'bg-surface2 text-text border border-transparent hover:border-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    selectedServices.includes(service) ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {selectedServices.includes(service) && <Check size={12} className="text-white" />}
                  </div>
                  {service}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                placeholder="Add custom service..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
              />
              <button
                onClick={addCustomService}
                className="px-4 py-2.5 rounded-xl bg-surface2 text-text border border-border hover:bg-surface text-sm"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {selectedServices.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text">Set Pricing</h3>
                <select
                  value={currency}
                  onChange={(e) => updateCurrency(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface2 text-text text-sm"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="space-y-3">
                {selectedServices.map((service) => (
                  <div key={service} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-text">{service}</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                        {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : '£'}
                      </span>
                      <input
                        type="number"
                        value={pricing.find((p) => p.service === service)?.price || ''}
                        onChange={(e) => updatePrice(service, Number(e.target.value))}
                        placeholder="0"
                        className="w-36 pl-8 pr-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-text">Total</span>
                  <span className="font-bold text-lg text-primary">
                    {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : '£'}{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl border border-border bg-surface">
            <h3 className="text-sm font-semibold text-text mb-3">Timeline</h3>
            <div className="flex flex-wrap gap-2">
              {TIMELINE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeline(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    timeline === t
                      ? 'bg-primary text-white'
                      : 'bg-surface2 text-text border border-border hover:border-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3.5 rounded-xl bg-surface2 text-text border border-border hover:bg-surface font-medium flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || selectedServices.length === 0}
              className="flex-1 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="w-5 h-5" /> Generate Proposal — 5 Credits</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
