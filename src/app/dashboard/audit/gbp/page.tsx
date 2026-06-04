'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2, CheckCircle, AlertTriangle, XCircle, ChevronDown, Star, Phone, Globe, Clock, Camera, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface CheckResult {
  score: number;
  label: string;
  detail: string;
  weight: number;
}

interface Recommendation {
  priority: string;
  title: string;
  description: string;
  impact: string;
}

interface BusinessInfo {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number;
  hours: string | null;
  thumbnail: string | null;
  type: string | null;
}

interface AuditResult {
  auditId: string;
  overallScore: number;
  checks: Record<string, CheckResult>;
  recommendations: Recommendation[];
  business: BusinessInfo | null;
}

interface PastAudit {
  id: string;
  business_name: string;
  location: string | null;
  overall_score: number;
  created_at: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-400';
  if (score >= 60) return 'bg-yellow-400';
  return 'bg-red-400';
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-green-400';
  if (score >= 60) return 'stroke-yellow-400';
  return 'stroke-red-400';
}

function getPriorityColor(priority: string): string {
  if (priority === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-green-500/20 text-green-400 border-green-500/30';
}

function getCheckIcon(key: string) {
  switch (key) {
    case 'claimed': return <Building2 className="w-5 h-5" />;
    case 'hasPhotos': return <Camera className="w-5 h-5" />;
    case 'hasPhone': return <Phone className="w-5 h-5" />;
    case 'hasWebsite': return <Globe className="w-5 h-5" />;
    case 'hasRating': return <Star className="w-5 h-5" />;
    case 'hasHours': return <Clock className="w-5 h-5" />;
    case 'hasAddress': return <MapPin className="w-5 h-5" />;
    default: return <CheckCircle className="w-5 h-5" />;
  }
}

export default function GBPAuditPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [pastAudits, setPastAudits] = useState<PastAudit[]>([]);
  const [showPastAudits, setShowPastAudits] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sparkleads_gbp_check');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.location) setLocation(data.location);
        localStorage.removeItem('sparkleads_gbp_check');
      } catch { /* ignore */ }
    }

    fetchPastAudits();
  }, []);

  async function fetchPastAudits() {
    try {
      const res = await fetch('/api/audit/gbp/history');
      const data = await res.json();
      if (data.audits) setPastAudits(data.audits);
    } catch { /* ignore */ }
  }

  async function handleAudit(e: React.FormEvent) {
    e.preventDefault();

    if (!businessName.trim()) {
      toast.error('Please enter a business name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/audit/gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          location: location.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to audit business');
        }
        return;
      }

      setResult(data);
      toast.success('GBP audit complete!');
      fetchPastAudits();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPastAudit(audit: PastAudit) {
    try {
      const res = await fetch(`/api/audit/gbp/history/${audit.id}`);
      const data = await res.json();
      if (data.audit) {
        setResult({
          auditId: data.audit.id,
          overallScore: data.audit.overall_score,
          checks: data.audit.breakdown,
          recommendations: data.audit.recommendations,
          business: data.audit.serpapi_data?.local_results?.[0]
            ? {
                name: data.audit.serpapi_data.local_results[0].title || data.audit.business_name,
                address: data.audit.serpapi_data.local_results[0].address || null,
                phone: data.audit.serpapi_data.local_results[0].phone || null,
                website: data.audit.serpapi_data.local_results[0].website || null,
                rating: data.audit.serpapi_data.local_results[0].rating || null,
                reviews: data.audit.serpapi_data.local_results[0].reviews || 0,
                hours: data.audit.serpapi_data.local_results[0].hours || null,
                thumbnail: data.audit.serpapi_data.local_results[0].thumbnail || null,
                type: data.audit.serpapi_data.local_results[0].type || null,
              }
            : null,
        });
        setBusinessName(data.audit.business_name);
        setLocation(data.audit.location || '');
      }
    } catch {
      toast.error('Failed to load audit');
    }
  }

  const circumference = 2 * Math.PI * 45;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Google Business Profile Auditor</h1>
        <p className="text-muted">Check if a business has claimed and optimized their Google listing.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Form + Past Audits */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleAudit} className="p-6 rounded-2xl border border-border bg-surface space-y-4">
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
              <label className="block text-sm font-medium text-text mb-1.5">Location (recommended)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">Adding a location helps find the exact business</p>
            </div>

            <button
              type="submit"
              disabled={loading || !businessName.trim()}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Audit GBP — 2 Credits
                </>
              )}
            </button>
          </form>

          {/* Past Audits */}
          {pastAudits.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => setShowPastAudits(!showPastAudits)}
                className="flex items-center justify-between w-full text-sm font-medium text-text mb-3"
              >
                <span>Past Audits ({pastAudits.length})</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPastAudits ? 'rotate-180' : ''}`} />
              </button>
              {showPastAudits && (
                <div className="space-y-2">
                  {pastAudits.map((audit) => (
                    <button
                      key={audit.id}
                      onClick={() => loadPastAudit(audit)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface2 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text truncate">{audit.business_name}</p>
                        {audit.location && <p className="text-xs text-muted truncate">{audit.location}</p>}
                      </div>
                      <span className={`text-lg font-bold ml-3 ${getScoreColor(audit.overall_score)}`}>
                        {audit.overall_score}
                      </span>
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
              {/* Profile Found / Not Found */}
              {result.business ? (
                <div className="p-6 rounded-2xl border border-green-500/30 bg-green-500/5">
                  <div className="flex items-start gap-4">
                    {result.business.thumbnail && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={result.business.thumbnail}
                        alt={result.business.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Profile Found
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-text">{result.business.name}</h3>
                      {result.business.address && (
                        <p className="text-sm text-muted flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {result.business.address}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                        {result.business.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {result.business.rating} ({result.business.reviews} reviews)
                          </span>
                        )}
                        {result.business.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {result.business.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      <XCircle className="w-3 h-3" />
                      Profile Not Found
                    </span>
                  </div>
                  <p className="text-text font-medium">No Google Business Profile found</p>
                  <p className="text-sm text-muted mt-1">
                    This business has no Google listing — this is a major opportunity for your agency to help them get found online.
                  </p>
                </div>
              )}

              {/* Score Circle */}
              <div className="p-8 rounded-2xl border border-border bg-surface text-center">
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90 w-40 h-40">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-surface2" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      className={getScoreStrokeColor(result.overallScore)}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - result.overallScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>{result.overallScore}</span>
                    <span className="text-xs text-muted">out of 100</span>
                  </div>
                </div>
                <p className="text-lg font-semibold text-text">
                  {result.overallScore >= 80 ? '🌟 Excellent' : result.overallScore >= 60 ? '✅ Good' : result.overallScore >= 40 ? '⚠️ Needs Work' : '❌ Poor'}
                </p>
                <p className="text-sm text-muted mt-1">{businessName}</p>
              </div>

              {/* Checks Breakdown */}
              <div className="p-6 rounded-2xl border border-border bg-surface">
                <h3 className="text-lg font-semibold text-text mb-4">Profile Checks</h3>
                <div className="space-y-4">
                  {Object.entries(result.checks).map(([key, check]) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        check.score >= 80 ? 'bg-green-500/20 text-green-400' :
                        check.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {getCheckIcon(key)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text">{check.label}</span>
                          <span className={`text-sm font-bold ${getScoreColor(check.score)}`}>{check.score}/100</span>
                        </div>
                        <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(check.score)}`}
                            style={{ width: `${check.score}%` }}
                          />
                        </div>
                        {check.detail && <p className="text-xs text-muted mt-1">{check.detail}</p>}
                      </div>
                      <span className="text-xs text-muted w-16 text-right">Weight: {check.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Analysis */}
              {result.business?.rating && (
                <div className="p-6 rounded-2xl border border-border bg-surface">
                  <h3 className="text-lg font-semibold text-text mb-3">Rating Analysis</h3>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-4xl font-bold text-text flex items-center gap-1">
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                      {result.business.rating}
                    </div>
                    <div>
                      <p className="text-sm text-text font-medium">
                        {result.business.reviews} reviews —{' '}
                        {result.business.rating >= 4.0 ? 'Good' : result.business.rating >= 3.0 ? 'Needs Improvement' : 'Critical'}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {result.business.reviews < 10
                          ? 'A business with under 10 reviews is losing customers to competitors with more social proof.'
                          : result.business.reviews < 50
                            ? 'Good review count. Continue collecting reviews to stay competitive.'
                            : 'Strong review presence — this business has solid social proof.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="p-6 rounded-2xl border border-border bg-surface">
                  <h3 className="text-lg font-semibold text-text mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-xl border border-border bg-surface2">
                        <div className="flex items-start gap-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text mb-1">{rec.title}</p>
                            <p className="text-xs text-muted leading-relaxed">{rec.description}</p>
                            {rec.impact && <p className="text-xs text-primary mt-2 font-medium">{rec.impact}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunity Callout */}
              {result.overallScore < 70 && (
                <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text mb-1">
                        This business scores {result.overallScore}/100 on Google Business Profile
                      </p>
                      <p className="text-xs text-muted leading-relaxed">
                        This is an opportunity — offer to optimize their Google listing as a service.
                        Businesses with optimized profiles get 7x more clicks. Typical agency charge: ₦30,000 - ₦50,000.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('sparkleads_content_lead', JSON.stringify({
                      name: businessName,
                      address: location,
                      ...result.business,
                    }));
                    router.push('/dashboard/content');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                >
                  Generate Content
                </button>
                <button
                  onClick={() => toast.success('Audit saved to your history')}
                  className="px-4 py-2.5 rounded-xl bg-surface2 hover:bg-surface text-text text-sm font-medium transition-colors border border-border"
                >
                  Saved to History
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border bg-surface/50 text-center">
              <MapPin className="w-12 h-12 text-muted mb-4" />
              <p className="text-lg font-medium text-text mb-2">No results yet</p>
              <p className="text-sm text-muted">Enter a business name and click Audit to check their Google profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
