'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText, Loader2, AlertTriangle, CheckCircle, TrendingUp, Printer,
  Target, DollarSign, Zap, Globe, MapPin, Phone as PhoneIcon,
} from 'lucide-react';
import NextStepBanner from '@/components/pipeline/NextStepBanner';
import { toast } from 'sonner';

interface ReportContent {
  executive_summary: string;
  health_status: string;
  critical_issues: { issue: string; impact: string; urgency: string }[];
  improvement_areas: { area: string; current: string; target: string }[];
  working_well: string[];
  action_plan: { step: number; action: string; timeline: string; expected_outcome: string }[];
  roi_justification: string;
  closing_pitch: string;
}

interface ReportResult {
  reportId: string;
  overallScore: number;
  websiteScore: number;
  gbpScore: number;
  report: ReportContent;
  websiteGrade: Record<string, unknown> | null;
  gbpAudit: Record<string, unknown> | null;
}

interface SavedReport {
  id: string;
  business_name: string;
  overall_score: number;
  created_at: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-green-400';
  if (score >= 60) return 'stroke-yellow-400';
  return 'stroke-red-400';
}

function getHealthColor(status: string): string {
  if (status === 'Excellent') return 'bg-green-500/10 border-green-500/30 text-green-400';
  if (status === 'Good') return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  if (status === 'Needs Improvement') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  return 'bg-red-500/10 border-red-500/30 text-red-400';
}

function ScoreCircle({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const svgSize = size;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: svgSize, height: svgSize }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-surface2" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke="currentColor"
            className={getScoreStrokeColor(score)}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-[10px] text-muted">/100</span>
        </div>
      </div>
      <p className="text-xs text-muted mt-2 text-center">{label}</p>
    </div>
  );
}

export default function AuditReportPage() {
  const searchParams = useSearchParams();
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Read query params once (pipeline navigation)
  const nameFromParams = searchParams.get('name');

  useEffect(() => {
    if (nameFromParams) {
      setBusinessName(decodeURIComponent(nameFromParams));
    }

    const stored = localStorage.getItem('sparkleads_report_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.websiteUrl) setWebsiteUrl(data.websiteUrl || '');
        if (data.location) setLocation(data.location || '');
        if (data.phone) setPhone(data.phone || '');
        localStorage.removeItem('sparkleads_report_data');
      } catch { /* ignore */ }
    }
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFromParams]);

  async function fetchSaved() {
    try {
      const res = await fetch('/api/audit/report/history');
      const data = await res.json();
      if (data.reports) setSavedReports(data.reports);
    } catch { /* ignore */ }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) { toast.error('Enter a business name'); return; }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/audit/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          location: location.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to generate report');
        }
        return;
      }

      setResult(data);
      toast.success('Audit report generated!');
      fetchSaved();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(id: string) {
    try {
      const res = await fetch(`/api/audit/report/history/${id}`);
      const data = await res.json();
      if (data.report) {
        const rd = data.report.report_data;
        setResult({
          reportId: data.report.id,
          overallScore: data.report.overall_score,
          websiteScore: rd.website_grade?.overallScore || 0,
          gbpScore: rd.gbp_audit?.overallScore || 0,
          report: rd.report_content,
          websiteGrade: rd.website_grade,
          gbpAudit: rd.gbp_audit,
        });
        setBusinessName(data.report.business_name);
      }
    } catch {
      toast.error('Failed to load report');
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          nav, aside, header, .no-print, .sidebar-wrapper { display: none !important; }
          .audit-report { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 20px !important; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          .audit-report * { color: black !important; border-color: #ddd !important; }
          .audit-report .print-bg { background: #f5f5f5 !important; }
          .page-break { break-before: page; }
          h1 { font-size: 24pt !important; }
          h2 { font-size: 18pt !important; }
          h3 { font-size: 14pt !important; }
          p, li { font-size: 11pt !important; line-height: 1.6 !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 no-print">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Digital Audit Report</h1>
            <p className="text-muted">Generate a professional report combining website grade + GBP audit.</p>
          </div>
          {savedReports.length > 0 && (
            <div className="relative group">
              <button className="px-4 py-2 rounded-xl bg-surface2 text-text text-sm border border-border hover:bg-surface transition-colors">
                Past Reports ({savedReports.length})
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-64 overflow-y-auto">
                {savedReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => loadReport(r.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-surface2 transition-colors text-left border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-text truncate">{r.business_name}</p>
                      <p className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(r.overall_score)}`}>{r.overall_score}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="p-6 rounded-2xl border border-border bg-surface space-y-4 mb-8 no-print">
          <div className="grid sm:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-text mb-1.5">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Location</label>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Phone</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !businessName.trim()}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Report...</>
            ) : (
              <><FileText className="w-5 h-5" /> Generate Full Report — 10 Credits</>
            )}
          </button>
        </form>

        {/* Report */}
        {result && result.report && (
          <div className="audit-report space-y-6">
            {/* Header Card */}
            <div className="p-8 rounded-2xl border border-border bg-surface text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-text">Digital Presence Audit</span>
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">{businessName}</h2>
              <p className="text-sm text-muted mb-6">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              {/* Score Gauges */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
                {result.websiteScore > 0 && (
                  <ScoreCircle score={result.websiteScore} label="Website Score" />
                )}
                <ScoreCircle score={result.gbpScore} label="Google Business Profile" />
                <ScoreCircle score={result.overallScore} label="Overall Score" size={150} />
              </div>

              {/* Health Status */}
              <div className={`inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full border text-sm font-medium ${getHealthColor(result.report.health_status)}`}>
                {result.report.health_status === 'Excellent' ? <CheckCircle size={16} /> :
                  result.report.health_status === 'Good' ? <TrendingUp size={16} /> :
                    result.report.health_status === 'Needs Improvement' ? <AlertTriangle size={16} /> :
                      <AlertTriangle size={16} />}
                {result.report.health_status}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Executive Summary
              </h3>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{result.report.executive_summary}</p>
            </div>

            {/* Critical Issues */}
            {result.report.critical_issues.length > 0 && (
              <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Critical Issues
                </h3>
                <div className="space-y-3">
                  {result.report.critical_issues.map((issue, i) => (
                    <div key={i} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                      <p className="font-medium text-text text-sm mb-1">{issue.issue}</p>
                      <p className="text-xs text-muted mb-2">{issue.impact}</p>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        {issue.urgency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {result.report.improvement_areas.length > 0 && (
              <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Improvement Areas
                </h3>
                <div className="space-y-3">
                  {result.report.improvement_areas.map((area, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-yellow-400 mt-0.5">→</span>
                      <div>
                        <p className="font-medium text-text">{area.area}</p>
                        <p className="text-xs text-muted">
                          <span className="text-red-400">{area.current}</span> → <span className="text-green-400">{area.target}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What's Working */}
            {result.report.working_well.length > 0 && (
              <div className="p-6 rounded-2xl border border-green-500/30 bg-green-500/5">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> What&apos;s Working Well
                </h3>
                <ul className="space-y-2">
                  {result.report.working_well.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text">
                      <span className="text-green-400 mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Plan */}
            {result.report.action_plan.length > 0 && (
              <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 page-break">
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Priority Action Plan
                </h3>
                <div className="space-y-4">
                  {result.report.action_plan.map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-text text-sm">{step.action}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-surface2 text-muted border border-border">
                            {step.timeline}
                          </span>
                        </div>
                        <p className="text-xs text-muted">{step.expected_outcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROI Justification */}
            <div className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> ROI Justification
              </h3>
              <p className="text-sm text-text leading-relaxed">{result.report.roi_justification}</p>
            </div>

            {/* Closing */}
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <p className="text-sm text-muted leading-relaxed italic">{result.report.closing_pitch}</p>
            </div>

            {/* Next Step Banner */}
            <NextStepBanner
              currentStep="audit"
              data={{
                businessName,
                auditId: result.reportId,
                websiteScore: result.websiteScore,
                gbpScore: result.gbpScore,
              }}
            />

            {/* Print Button */}
            <div className="flex justify-center no-print">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Download as PDF
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border bg-surface/50 text-center no-print">
            <FileText className="w-12 h-12 text-muted mb-4" />
            <p className="text-lg font-medium text-text mb-2">No report yet</p>
            <p className="text-sm text-muted">Enter business details above to generate a professional audit report</p>
          </div>
        )}
      </div>
    </>
  );
}
