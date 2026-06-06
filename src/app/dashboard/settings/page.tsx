'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Copy,
  Check,
  Shield,
  Bell,
  Mail,
  MessageCircle,
  Trash2,
  AlertTriangle,
  X,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';
import { FREELANCER_TYPES } from '@/lib/freelancer-types';

export default function SettingsPage() {
  const router = useRouter();
  const [userToken, setUserToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearResult, setClearResult] = useState<number | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [savingSender, setSavingSender] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [senderMessage, setSenderMessage] = useState('');
  const [freelancerType, setFreelancerType] = useState('');
  const [savingType, setSavingType] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sparkleads_session_id') || '';
    setUserToken(token);

    // Load freelancer type from localStorage first for instant UI
    const saved = localStorage.getItem('sparkleads_freelancer_type') || '';
    setFreelancerType(saved);

    fetch('/api/settings/email')
      .then((res) => res.json())
      .then((data) => {
        setSenderName(data.senderName || '');
        setSenderEmail(data.senderEmail || '');
        setHasPassword(data.hasPassword || false);
      })
      .catch(() => {});

    // Load freelancer type from Supabase
    fetch('/api/settings/agency')
      .then((res) => res.json())
      .then((data) => {
        if (data.freelancerType) {
          setFreelancerType(data.freelancerType);
          localStorage.setItem('sparkleads_freelancer_type', data.freelancerType);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyToken = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }, [userToken]);

  const saveFreelancerType = useCallback(async (typeId: string) => {
    setFreelancerType(typeId);
    localStorage.setItem('sparkleads_freelancer_type', typeId);
    setSavingType(true);
    try {
      await fetch('/api/settings/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerType: typeId }),
      });
    } catch {
      // Silent fail — localStorage is already saved
    } finally {
      setSavingType(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('sparkleads_session_id');
      router.push('/');
    } catch {
      localStorage.removeItem('sparkleads_session_id');
      router.push('/');
    } finally {
      setLoggingOut(false);
    }
  }, [router]);

  const handleClearHistory = useCallback(async () => {
    setClearLoading(true);
    try {
      const response = await fetch('/api/user/clear-history', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setClearResult(data.deleted_count);
        setShowClearModal(false);
      }
    } catch {
      // Silent fail
    } finally {
      setClearLoading(false);
    }
  }, []);

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
      if (res.ok) {
        setSenderMessage('Test email sent! Check your inbox.');
      } else {
        const data = await res.json();
        setSenderMessage(data.error || 'Failed to send test email');
      }
    } catch {
      setSenderMessage('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  }, []);

  return (
    <div className="max-w-2xl space-y-8">
      {/* My Service Section */}
      <div id="service" className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">My Service</h2>
            <p className="text-xs text-muted">
              Pick your service type and SparkLeads will show opportunity scores beside every lead.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FREELANCER_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => saveFreelancerType(type.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                freelancerType === type.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface2 hover:border-primary/50'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <p className="text-sm font-semibold text-text">{type.label}</p>
              <p className="text-xs text-muted mt-1">
                Shows {type.scoreLabel}
              </p>
            </button>
          ))}
        </div>

        {savingType && (
          <p className="text-xs text-muted mt-3 flex items-center gap-2">
            <Spinner size="sm" /> Saving...
          </p>
        )}
      </div>

      {/* Account Section */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text">Account</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              User Token
            </label>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface2 border border-border">
                <span className="text-sm text-text font-mono truncate">
                  {userToken}
                </span>
              </div>
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface2 text-sm text-muted hover:text-text transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <span className="text-sm text-muted">Activation Date</span>
            <span className="text-sm text-text">
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted">Plan</span>
            <span className="flex items-center gap-2 text-sm font-medium text-success">
              <Shield className="w-4 h-4" />
              Lifetime Access ✓
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-muted text-sm font-medium hover:text-text hover:bg-surface2 transition-colors disabled:opacity-50"
          >
            {loggingOut ? (
              <Spinner size="sm" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Log out
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text">Notifications</h2>
          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
            Coming soon
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted" />
              <div>
                <p className="text-sm text-text">Email Notifications</p>
                <p className="text-xs text-muted">Get notified about new features</p>
              </div>
            </div>
            <button
              disabled
              className="relative w-11 h-6 rounded-full bg-surface2 border border-border opacity-50 cursor-not-allowed"
            >
              <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-muted" />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-muted" />
              <div>
                <p className="text-sm text-text">WhatsApp Alerts</p>
                <p className="text-xs text-muted">Lead status updates via WhatsApp</p>
              </div>
            </div>
            <button
              disabled
              className="relative w-11 h-6 rounded-full bg-surface2 border border-border opacity-50 cursor-not-allowed"
            >
              <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-muted" />
            </button>
          </div>
        </div>
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
              {savingSender ? <Spinner size="sm" /> : 'Save Sender Settings'}
            </button>
            <button
              onClick={testSenderEmail}
              disabled={testingEmail || !hasPassword}
              className="px-4 py-2.5 rounded-lg border border-border text-muted text-sm font-medium hover:text-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testingEmail ? <Spinner size="sm" /> : 'Send Test Email to Myself'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-danger/20 bg-surface">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <h2 className="text-lg font-semibold text-text">Danger Zone</h2>
        </div>

        {clearResult !== null && (
          <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
            Successfully deleted {clearResult} searches and all associated leads.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Clear all search history</p>
            <p className="text-xs text-muted">
              This will permanently delete all your searches and leads
            </p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowClearModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl">
            <button
              onClick={() => setShowClearModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-danger" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">
                Clear all search history?
              </h3>
              <p className="text-sm text-muted">
                This action cannot be undone. All your searches and leads will be
                permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted text-sm font-medium hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={clearLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {clearLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
