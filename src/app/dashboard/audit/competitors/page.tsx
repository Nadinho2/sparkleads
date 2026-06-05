'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Loader2, Trophy, TrendingUp, TrendingDown, Minus,
  Star, Phone, Globe, Camera, ChevronDown, MapPin, Target, AlertTriangle, Zap, MessageCircle,
} from 'lucide-react';
import NextStepBanner from '@/components/pipeline/NextStepBanner';
import WhatsAppPreviewModal from '@/components/outreach/WhatsAppPreviewModal';
import { toast } from 'sonner';

interface ScoredBusiness {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number;
  hasPhotos: boolean;
  scores: {
    rating: number;
    reviews: number;
    hasWebsite: number;
    hasPhone: number;
    hasPhotos: number;
  };
  overallScore: number;
}

interface Analysis {
  position: string;
  position_reason: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategy: string;
  market_rank: number;
}

interface AnalysisResult {
  analysisId: string;
  subject: ScoredBusiness | null;
  competitors: ScoredBusiness[];
  analysis: Analysis;
}

interface PastAnalysis {
  id: string;
  business_name: string;
  location: string;
  created_at: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getBestWorst(values: (number | null)[], higher: boolean = true): { best: number; worst: number } {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return { best: -1, worst: -1 };
  return {
    best: higher ? Math.max(...valid) : Math.min(...valid),
    worst: higher ? Math.min(...valid) : Math.max(...valid),
  };
}

export default function CompetitorAnalysisPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([]);
  const [showPast, setShowPast] = useState(true);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [generatingWhatsApp, setGeneratingWhatsApp] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sparkleads_competitor_check');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.businessType) setBusinessType(data.businessType || '');
        if (data.location) setLocation(data.location);
        localStorage.removeItem('sparkleads_competitor_check');
      } catch { /* ignore */ }
    }
    fetchPast();
  }, []);

  async function fetchPast() {
    try {
      const res = await fetch('/api/audit/competitors/history');
      const data = await res.json();
      if (data.analyses) setPastAnalyses(data.analyses);
    } catch { /* ignore */ }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) { toast.error('Enter a business name'); return; }
    if (!location.trim()) { toast.error('Location is required to find competitors'); return; }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/audit/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType: businessType.trim() || businessName.trim(),
          location: location.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to analyze');
        }
        return;
      }

      setResult(data);
      toast.success('Competitor analysis complete!');
      fetchPast();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function loadPast(analysis: PastAnalysis) {
    try {
      const res = await fetch(`/api/audit/competitors/history/${analysis.id}`);
      const data = await res.json();
      if (data.analysis) {
        setResult({
          analysisId: data.analysis.id,
          subject: data.analysis.subject_data,
          competitors: data.analysis.competitors,
          analysis: data.analysis.analysis,
        });
        setBusinessName(data.analysis.business_name);
        setLocation(data.analysis.location || '');
        setBusinessType(data.analysis.business_type || '');
      }
    } catch {
      toast.error('Failed to load analysis');
    }
  }

  async function generateWhatsApp() {
    if (!result) return;
    setGeneratingWhatsApp(true);
    try {
      const res = await fetch('/api/competitors/whatsapp-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorAnalysisId: result.analysisId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWhatsappMessage(data.message);
      setWhatsappPhone(data.phone || '');
      setWhatsappModal(true);
    } catch {
      toast.error('Failed to generate WhatsApp message');
    } finally {
      setGeneratingWhatsApp(false);
    }
  }

  function sendWhatsApp() {
    if (!whatsappPhone) {
      toast.error('No phone number available for this business');
      return;
    }
    const cleaned = whatsappPhone.replace(/[^0-9+]/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${cleaned}?text=${encoded}`, '_blank');
    setWhatsappModal(false);
  }

  // Build comparison table data
  const allBusinesses = result ? [
    ...(result.subject ? [{ ...result.subject, isSubject: true }] : []),
    ...result.competitors.map((c) => ({ ...c, isSubject: false })),
  ] : [];

  const ratingValues = allBusinesses.map((b) => b.rating);
  const reviewValues = allBusinesses.map((b) => b.reviews);
  const ratingBW = getBestWorst(ratingValues);
  const reviewBW = getBestWorst(reviewValues);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Competitor Analysis</h1>
        <p className="text-muted">See how a business compares to its top 5 local competitors.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleAnalyze} className="p-6 rounded-2xl border border-border bg-surface space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Lagos Plumbing Co."
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Business Type</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. plumber, restaurant, salon"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <p className="mt-1.5 text-xs text-muted">Used to find similar businesses</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !businessName.trim() || !location.trim()}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><Users className="w-5 h-5" /> Analyze Competitors — 5 Credits</>
              )}
            </button>
          </form>

          {pastAnalyses.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => setShowPast(!showPast)}
                className="flex items-center justify-between w-full text-sm font-medium text-text mb-3"
              >
                <span>Past Analyses ({pastAnalyses.length})</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? 'rotate-180' : ''}`} />
              </button>
              {showPast && (
                <div className="space-y-2">
                  {pastAnalyses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => loadPast(a)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface2 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text truncate">{a.business_name}</p>
                        <p className="text-xs text-muted truncate">{a.location}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Results */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              {/* Competitive Position Banner */}
              {result.analysis && (
                <div className={`rounded-xl border p-5 ${
                  result.analysis.position === 'Leading'
                    ? 'bg-green-500/10 border-green-500/20'
                    : result.analysis.position === 'Average'
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.analysis.position === 'Leading' ? (
                      <Trophy size={24} className="text-green-400" />
                    ) : result.analysis.position === 'Average' ? (
                      <Minus size={24} className="text-yellow-400" />
                    ) : (
                      <TrendingDown size={24} className="text-red-400" />
                    )}
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${
                        result.analysis.position === 'Leading' ? 'text-green-400'
                          : result.analysis.position === 'Average' ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}>
                        {result.analysis.position === 'Leading' ? 'Market Leader'
                          : result.analysis.position === 'Average' ? 'Average Position'
                            : 'Behind Competitors'}
                      </p>
                      <p className="text-sm text-muted">{result.analysis.position_reason}</p>
                    </div>
                    <span className={`text-2xl font-bold ${
                      result.analysis.position === 'Leading' ? 'text-green-400'
                        : result.analysis.position === 'Average' ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}>
                      #{result.analysis.market_rank}
                    </span>
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              {allBusinesses.length > 0 && (
                <div className="p-6 rounded-2xl border border-border bg-surface overflow-x-auto">
                  <h3 className="text-lg font-semibold text-text mb-4">Comparison Table</h3>
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted pb-3 pr-4">Metric</th>
                        {allBusinesses.map((b, i) => (
                          <th key={i} className={`text-center text-xs font-medium pb-3 px-2 ${
                            b.isSubject ? 'text-primary border-b-2 border-primary' : 'text-muted'
                          }`}>
                            {b.isSubject ? '★ ' : ''}{b.name.length > 15 ? b.name.slice(0, 15) + '…' : b.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted font-medium">Overall Score</td>
                        {allBusinesses.map((b, i) => (
                          <td key={i} className={`text-center py-3 px-2 font-bold ${getScoreColor(b.overallScore)} ${b.isSubject ? 'bg-primary/5 rounded' : ''}`}>
                            {b.overallScore}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted font-medium flex items-center gap-1"><Star size={14} /> Rating</td>
                        {allBusinesses.map((b, i) => (
                          <td key={i} className={`text-center py-3 px-2 ${b.isSubject ? 'bg-primary/5 rounded' : ''} ${
                            b.rating === ratingBW.best ? 'text-green-400 font-bold' : b.rating === ratingBW.worst ? 'text-red-400' : ''
                          }`}>
                            {b.rating ? `${b.rating}⭐` : '—'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted font-medium">Reviews</td>
                        {allBusinesses.map((b, i) => (
                          <td key={i} className={`text-center py-3 px-2 ${b.isSubject ? 'bg-primary/5 rounded' : ''} ${
                            b.reviews === reviewBW.best ? 'text-green-400 font-bold' : b.reviews === reviewBW.worst ? 'text-red-400' : ''
                          }`}>
                            {b.reviews}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted font-medium flex items-center gap-1"><Globe size={14} /> Website</td>
                        {allBusinesses.map((b, i) => (
                          <td key={i} className={`text-center py-3 px-2 ${b.isSubject ? 'bg-primary/5 rounded' : ''}`}>
                            {b.website ? '✅' : '❌'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted font-medium flex items-center gap-1"><Phone size={14} /> Phone</td>
                        {allBusinesses.map((b, i) => (
                          <td key={i} className={`text-center py-3 px-2 ${b.isSubject ? 'bg-primary/5 rounded' : ''}`}>
                            {b.phone ? '✅' : '❌'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 text-muted font-medium flex items-center gap-1"><Camera size={14} /> Photos</td>
                        {allBusinesses.map((b, i) => (
                          <td key={i} className={`text-center py-3 px-2 ${b.isSubject ? 'bg-primary/5 rounded' : ''}`}>
                            {b.hasPhotos ? '✅' : '❌'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* SWOT Analysis */}
              {result.analysis && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/5">
                    <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <TrendingUp size={16} /> Strengths
                    </h4>
                    <ul className="space-y-2">
                      {result.analysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-text flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <TrendingDown size={16} /> Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {result.analysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-text flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <Target size={16} /> Opportunities
                    </h4>
                    <ul className="space-y-2">
                      {result.analysis.opportunities.map((o, i) => (
                        <li key={i} className="text-sm text-text flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span> {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} /> Threats
                    </h4>
                    <ul className="space-y-2">
                      {result.analysis.threats.map((t, i) => (
                        <li key={i} className="text-sm text-text flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Strategy Recommendation */}
              {result.analysis?.strategy && (
                <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5">
                  <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> Strategy Recommendation
                  </h3>
                  <p className="text-sm text-text leading-relaxed">{result.analysis.strategy}</p>
                </div>
              )}

              {/* Competitor Detail Cards */}
              {result.competitors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-text">Competitor Details</h3>
                  {result.competitors.map((comp, i) => (
                    <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
                      <button
                        onClick={() => setExpandedCompetitor(expandedCompetitor === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${getScoreColor(comp.overallScore)}`}>{comp.overallScore}</span>
                          <div className="text-left">
                            <p className="text-sm font-medium text-text">{comp.name}</p>
                            <p className="text-xs text-muted">{comp.address || 'No address'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comp.rating && (
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {comp.rating}
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expandedCompetitor === i ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {expandedCompetitor === i && (
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted">Reviews:</span> <span className="text-text font-medium">{comp.reviews}</span></div>
                            <div><span className="text-muted">Phone:</span> <span className="text-text font-medium">{comp.phone || 'None'}</span></div>
                            <div><span className="text-muted">Website:</span> <span className="text-text font-medium">{comp.website || 'None'}</span></div>
                            <div><span className="text-muted">Photos:</span> <span className="text-text font-medium">{comp.hasPhotos ? 'Yes' : 'No'}</span></div>
                          </div>
                          {comp.website && (
                            <button
                              onClick={() => {
                                localStorage.setItem('sparkleads_grade_url', JSON.stringify({ url: comp.website, businessName: comp.name }));
                                router.push('/dashboard/audit/grade');
                              }}
                              className="mt-3 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors"
                            >
                              Grade Website
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* WhatsApp Pitch Button */}
              <div className="flex justify-end">
                <button
                  onClick={generateWhatsApp}
                  disabled={generatingWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {generatingWhatsApp ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                  {generatingWhatsApp ? 'Generating...' : 'Send WhatsApp Pitch'}
                </button>
              </div>

              {/* Next Step Banner */}
              <NextStepBanner
                currentStep="competitor"
                data={{
                  businessName,
                  competitorId: result.analysisId,
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border bg-surface/50 text-center">
              <Users className="w-12 h-12 text-muted mb-4" />
              <p className="text-lg font-medium text-text mb-2">No results yet</p>
              <p className="text-sm text-muted">Enter a business name and location to see competitor analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Preview Modal */}
      <WhatsAppPreviewModal
        isOpen={whatsappModal}
        message={whatsappMessage}
        businessName={businessName}
        phone={whatsappPhone}
        source="competitor"
        onSend={sendWhatsApp}
        onEdit={(msg) => setWhatsappMessage(msg)}
        onClose={() => setWhatsappModal(false)}
      />
    </div>
  );
}
