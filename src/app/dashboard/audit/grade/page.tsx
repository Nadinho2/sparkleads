'use client';

import { useState, useEffect } from 'react';
import { Globe, Zap, BarChart2, Loader2, CheckCircle, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface CheckResult {
  score: number;
  label: string;
  weight: number;
  details: string;
}

interface Recommendation {
  priority: string;
  title: string;
  description: string;
  impact: string;
}

interface GradeResult {
  gradeId: string;
  overallScore: number;
  checks: Record<string, CheckResult>;
  recommendations: Recommendation[];
}

interface PastGrade {
  id: string;
  url: string;
  business_name: string | null;
  overall_score: number;
  created_at: string;
}

function getGradeLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

function getGradeEmoji(score: number): string {
  if (score >= 90) return '🌟';
  if (score >= 70) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
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

export default function WebsiteGradePage() {
  const [url, setUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [pastGrades, setPastGrades] = useState<PastGrade[]>([]);
  const [showPastGrades, setShowPastGrades] = useState(true);

  useEffect(() => {
    // Pre-fill from localStorage if coming from a lead
    const stored = localStorage.getItem('sparkleads_grade_url');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.url) setUrl(data.url);
        if (data.businessName) setBusinessName(data.businessName);
        localStorage.removeItem('sparkleads_grade_url');
      } catch { /* ignore */ }
    }

    // Load past grades
    fetchPastGrades();
  }, []);

  async function fetchPastGrades() {
    try {
      const res = await fetch('/api/audit/grades');
      const data = await res.json();
      if (data.grades) setPastGrades(data.grades);
    } catch { /* ignore */ }
  }

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/audit/grade-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          businessName: businessName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Need ${data.required} credits. You have ${data.balance}.`);
        } else {
          toast.error(data.error || 'Failed to grade website');
        }
        return;
      }

      setResult(data);
      toast.success('Website graded successfully!');
      fetchPastGrades();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPastGrade(grade: PastGrade) {
    try {
      const res = await fetch(`/api/audit/grades/${grade.id}`);
      const data = await res.json();
      if (data.grade) {
        setResult({
          gradeId: data.grade.id,
          overallScore: data.grade.overall_score,
          checks: data.grade.breakdown,
          recommendations: data.grade.recommendations,
        });
        setUrl(data.grade.url);
        setBusinessName(data.grade.business_name || '');
      }
    } catch {
      toast.error('Failed to load grade');
    }
  }

  const circumference = 2 * Math.PI * 45;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Website Grader</h1>
        <p className="text-muted">Enter any business website URL to get a detailed score out of 100.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Form + Past Grades */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleGrade} className="p-6 rounded-2xl border border-border bg-surface space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Business Name (optional)</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Lagos Plumbing Co."
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Website URL *</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Grading...
                </>
              ) : (
                <>
                  <BarChart2 className="w-5 h-5" />
                  Grade Website — 2 Credits
                </>
              )}
            </button>
          </form>

          {/* Past Grades */}
          {pastGrades.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => setShowPastGrades(!showPastGrades)}
                className="flex items-center justify-between w-full text-sm font-medium text-text mb-3"
              >
                <span>Past Grades ({pastGrades.length})</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPastGrades ? 'rotate-180' : ''}`} />
              </button>
              {showPastGrades && (
                <div className="space-y-2">
                  {pastGrades.map((grade) => (
                    <button
                      key={grade.id}
                      onClick={() => loadPastGrade(grade)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface2 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text truncate">
                          {grade.business_name || grade.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        </p>
                        <p className="text-xs text-muted truncate">{grade.url}</p>
                      </div>
                      <span className={`text-lg font-bold ml-3 ${getScoreColor(grade.overall_score)}`}>
                        {grade.overall_score}
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
                  {getGradeEmoji(result.overallScore)} {getGradeLabel(result.overallScore)}
                </p>
                {businessName && <p className="text-sm text-muted mt-1">{businessName}</p>}
                <p className="text-xs text-muted mt-1">{url}</p>
              </div>

              {/* Checks Breakdown */}
              <div className="p-6 rounded-2xl border border-border bg-surface">
                <h3 className="text-lg font-semibold text-text mb-4">Breakdown</h3>
                <div className="space-y-4">
                  {Object.values(result.checks).map((check, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 flex-shrink-0">
                        {check.score >= 80 ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : check.score >= 50 ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
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
                        {check.details && (
                          <p className="text-xs text-muted mt-1">{check.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted w-16 text-right">Weight: {check.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

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
                            {rec.impact && (
                              <p className="text-xs text-primary mt-2 font-medium">{rec.impact}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border bg-surface/50 text-center">
              <BarChart2 className="w-12 h-12 text-muted mb-4" />
              <p className="text-lg font-medium text-text mb-2">No results yet</p>
              <p className="text-sm text-muted">Enter a website URL and click Grade to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
