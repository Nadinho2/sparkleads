'use client';

import { useState, useEffect, useCallback } from 'react';
import { FREELANCER_TYPES } from '@/lib/freelancer-types';
import { Spinner } from '@/components/ui';
import { Mail } from 'lucide-react';

export default function AgencySettingsPage() {
  const [workspace, setWorkspace] = useState<{ name: string; brand_color: string } | null>(null);
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

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data.workspace);
      });
    const saved = localStorage.getItem('sparkleads_freelancer_type') || '';
    setFreelancerType(saved);

    // Load email settings
    fetch('/api/settings/email')
      .then((r) => r.json())
      .then((data) => {
        setSenderName(data.senderName || '');
        setSenderEmail(data.senderEmail || '');
        setHasPassword(data.hasPassword || false);
      });
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {/* Workspace Info */}
      {workspace && (
        <div className="p-6 rounded-xl border border-border bg-surface">
          <h2 className="text-lg font-semibold text-text mb-4">Workspace</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Name</p>
              <p className="text-sm font-medium text-text">{workspace.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Brand Color</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: workspace.brand_color }} />
                <span className="text-sm font-mono text-muted">{workspace.brand_color}</span>
              </div>
            </div>
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
                placeholder="e.g. Nadinho — UltimaSpark Agency"
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
    </div>
  );
}
