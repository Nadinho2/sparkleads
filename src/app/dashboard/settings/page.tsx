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
} from 'lucide-react';
import { Spinner } from '@/components/ui';

export default function SettingsPage() {
  const [userToken, setUserToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearResult, setClearResult] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sparkleads_session_id') || '';
    setUserToken(token);
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

  return (
    <div className="max-w-2xl space-y-8">
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
