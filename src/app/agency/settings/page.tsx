'use client';

import { useState, useEffect, useCallback } from 'react';
import { FREELANCER_TYPES } from '@/lib/freelancer-types';
import { Spinner } from '@/components/ui';
import { Mail, LogOut, Shield, Lock, Sparkles, ArrowRight, Globe, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AgencySettingsPage() {
  const [workspace, setWorkspace] = useState<{ name: string; brand_color: string; plan?: string; logo_url?: string | null } | null>(null);
  const [currentMember, setCurrentMember] = useState<{ id: string; role: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [freelancerType, setFreelancerType] = useState('');
  const [saving, setSaving] = useState(false);

  // Email setup state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [savingSender, setSavingSender] = useState(false);
  const [senderMessage, setSenderMessage] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // Portfolio & Proof state
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [caseStudyMetric, setCaseStudyMetric] = useState('');
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioSaved, setPortfolioSaved] = useState(false);

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data.workspace);
        if (data.member) setCurrentMember(data.member);
      });
    const saved = localStorage.getItem('sparkleads_freelancer_type') || '';
    setFreelancerType(saved);
    const savedPortfolio = localStorage.getItem('sparkleads_portfolio_url') || '';
    if (savedPortfolio) setPortfolioUrl(savedPortfolio);
    const savedMetric = localStorage.getItem('sparkleads_case_study_metric') || '';
    if (savedMetric) setCaseStudyMetric(savedMetric);

    // Load email settings
    fetch('/api/settings/email')
      .then((r) => r.json())
      .then((data) => {
        setSenderName(data.senderName || '');
        setSenderEmail(data.senderEmail || '');
        setHasPassword(data.hasPassword || false);
      });

    // Load agency profile & portfolio
    fetch('/api/settings/agency')
      .then((r) => r.json())
      .then((data) => {
        if (data.portfolioUrl && !savedPortfolio) setPortfolioUrl(data.portfolioUrl);
        if (data.caseStudyMetric && !savedMetric) setCaseStudyMetric(data.caseStudyMetric);
      })
      .catch(() => {});
  }, []);

  const saveFreelancerType = async (typeId: string) => {
    setFreelancerType(typeId);
    localStorage.setItem('sparkleads_freelancer_type', typeId);
    setSaving(true);
    try {
      await fetch('/api/settings/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerType: typeId }),
      });
    } catch { /* silent */ }
    setSaving(false);
  };

  const saveSenderSettings = useCallback(async () => {
    setSavingSender(true);
    setSenderMessage('');
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName, senderEmail, senderPassword }),
      });
      if (res.ok) {
        setSenderMessage('Settings saved!');
        setHasPassword(true);
        setSenderPassword('');
      } else {
        setSenderMessage('Failed to save settings');
      }
    } catch {
      setSenderMessage('Failed to save settings');
    } finally {
      setSavingSender(false);
    }
  }, [senderName, senderEmail, senderPassword]);

  const testSenderEmail = useCallback(async () => {
    setTestingEmail(true);
    setSenderMessage('');
    try {
      const res = await fetch('/api/settings/email/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSenderMessage(`Test email sent to ${data.sentTo}!`);
      } else {
        setSenderMessage(data.error || 'Failed to send test email');
      }
    } catch {
      setSenderMessage('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  }, []);

  const savePortfolioSettings = useCallback(async () => {
    setSavingPortfolio(true);
    setPortfolioSaved(false);
    localStorage.setItem('sparkleads_portfolio_url', portfolioUrl.trim());
    localStorage.setItem('sparkleads_case_study_metric', caseStudyMetric.trim());
    try {
      await fetch('/api/settings/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioUrl: portfolioUrl.trim(),
          caseStudyMetric: caseStudyMetric.trim(),
        }),
      });
      setPortfolioSaved(true);
      toast.success('Proof & portfolio settings saved');
      setTimeout(() => setPortfolioSaved(false), 2500);
    } catch {
      // LocalStorage is already saved
    } finally {
      setSavingPortfolio(false);
    }
  }, [portfolioUrl, caseStudyMetric]);

  const handleLeaveWorkspace = async () => {
    if (!currentMember) return;
    if (!confirm('Are you sure you want to leave this workspace? You will lose access to its shared leads, credits, and campaigns.')) {
      return;
    }
    setLeaving(true);
    try {
      const res = await fetch(`/api/agency/members?memberId=${currentMember.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('You have left the workspace');
        window.location.href = '/login';
      } else {
        toast.error(data.error || 'Failed to leave workspace');
        setLeaving(false);
      }
    } catch {
      toast.error('Something went wrong');
      setLeaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {/* Workspace Info & Plan */}
      {workspace && (
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Workspace Information</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
              {workspace.plan === 'pro' || workspace.plan === 'agency' ? 'Agency / Scale Plan' : workspace.plan === 'growth' ? 'Growth Plan' : 'Starter Plan'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted">Workspace Name</p>
              <p className="text-sm font-semibold text-text mt-0.5">{workspace.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Brand Color</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: workspace.brand_color }} />
                <span className="text-xs font-mono text-muted">{workspace.brand_color}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Billing Cycle</p>
              <p className="text-sm font-semibold text-text mt-0.5">Active</p>
            </div>
          </div>

          {/* White-Label Custom Branding Tier Gating */}
          <div className="pt-4 border-t border-border">
            {workspace.plan === 'pro' || workspace.plan === 'agency' ? (
              <div className="p-4 rounded-xl bg-surface2 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">White-Label Custom Branding Unlocked</p>
                    <p className="text-xs text-muted">Your agency logo and brand colors appear on all client reports & proposals.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Active
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface2 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text flex items-center gap-1.5">
                      White-Label & Custom Branding
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Agency Feature
                      </span>
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Upgrade to the Agency ($199/mo) tier to remove SparkLeads badges, upload custom agency logos, and white-label client audit reports.
                    </p>
                  </div>
                </div>
                <Link
                  href="/agency/billing"
                  className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  Upgrade to Agency ($199) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Type */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h2 className="text-lg font-semibold text-text mb-2">Service Type</h2>
        <p className="text-xs text-muted mb-4">Pick your service type for opportunity scoring.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FREELANCER_TYPES.map((type) => (
            <button key={type.id} onClick={() => saveFreelancerType(type.id)} className={`p-4 rounded-xl border text-left transition-all ${freelancerType === type.id ? 'border-primary bg-primary/10' : 'border-border bg-surface2 hover:border-primary/50'}`}>
              <div className="text-2xl mb-2">{type.icon}</div>
              <p className="text-sm font-semibold text-text">{type.label}</p>
              <p className="text-xs text-muted mt-1">Shows {type.scoreLabel}</p>
            </button>
          ))}
        </div>
        {saving && <p className="text-xs text-muted mt-3 flex items-center gap-2"><Spinner size="sm" /> Saving...</p>}
      </div>

      {/* Sender Email Section */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text">Your Sender Email</h2>
        </div>

        <div className="space-y-4">
          <p className="text-muted text-sm">
            Emails you send will appear from this address. Recipients will see
            your name and email — not SparkLeads. Use a Gmail App Password
            for best results.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Your Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Nadinho | UltimaSpark Academy"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Your Email Address</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                App Password
                {hasPassword && (
                  <span className="ml-2 text-xs text-success">✓ Saved</span>
                )}
              </label>
              <input
                type="password"
                value={senderPassword}
                onChange={(e) => setSenderPassword(e.target.value)}
                placeholder={hasPassword ? 'Enter new password to change' : 'Gmail App Password (not your login password)'}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg bg-surface2 p-4 text-sm text-muted space-y-1">
            <p className="font-medium text-text">How to get a Gmail App Password:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to myaccount.google.com</li>
              <li>Security → 2-Step Verification (enable if not on)</li>
              <li>Search &quot;App passwords&quot; → Create one → Select &quot;Mail&quot;</li>
              <li>Copy the 16-character password and paste it above</li>
            </ol>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline mt-2 inline-block"
            >
              Go to App Passwords →
            </a>
          </div>

          {senderMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              senderMessage.includes('sent') || senderMessage.includes('Saved')
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}>
              {senderMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveSenderSettings}
              disabled={savingSender || !senderEmail || !senderPassword}
              className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingSender && <Spinner size="sm" />}
              Save Settings
            </button>
            {hasPassword && (
              <button
                onClick={testSenderEmail}
                disabled={testingEmail}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted hover:text-text hover:bg-surface2 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {testingEmail && <Spinner size="sm" />}
                Send Test Email
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Outreach Portfolio & Proof Section */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Proof & Portfolio (AI Message Writer)</h2>
            <p className="text-xs text-muted">
              Auto-fill your agency portfolio and quantifiable proof into cold emails to maximize reply rates.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Agency Portfolio / Work Samples URL <span className="text-xs text-muted/70">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="e.g. https://www.ultimaspark.com/agency"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
              />
            </div>
            <p className="text-xs text-muted mt-1">
              The AI incorporates this as your live proof asset (e.g. <em>&quot;You can see examples of my work here: {portfolioUrl || 'https://...'} &quot;</em>).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Key Metric / Social Proof <span className="text-xs text-muted/70">(Optional)</span>
            </label>
            <input
              type="text"
              value={caseStudyMetric}
              onChange={(e) => setCaseStudyMetric(e.target.value)}
              placeholder="e.g. Reclaimed 15+ hours/week, eliminated human errors in data handling, and reduced operational overhead"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
            <p className="text-xs text-muted mt-1">
              Gives the AI real business metrics to quote instead of generic sales pitches.
            </p>
          </div>

          {portfolioSaved && (
            <div className="p-3 rounded-lg text-sm bg-success/10 text-success flex items-center gap-2">
              <Check className="w-4 h-4" />
              Proof & portfolio settings saved! These will auto-populate in the AI Message Writer.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={savePortfolioSettings}
              disabled={savingPortfolio}
              className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingPortfolio ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
              Save Proof & Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Leave Workspace Option for non-owners */}
      {currentMember && currentMember.role !== 'owner' && (
        <div className="p-6 rounded-xl border border-red-500/20 bg-surface">
          <div className="flex items-center gap-3 mb-2">
            <LogOut className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-text">Leave this Workspace</h2>
          </div>
          <p className="text-sm text-muted mb-4">
            If you no longer work with this agency, you can leave this workspace on your own. You will immediately lose access to all shared agency data, clients, and allocated credits.
          </p>
          <button
            onClick={handleLeaveWorkspace}
            disabled={leaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <LogOut size={15} /> {leaving ? 'Leaving workspace...' : 'Leave Workspace'}
          </button>
        </div>
      )}
    </div>
  );
}
