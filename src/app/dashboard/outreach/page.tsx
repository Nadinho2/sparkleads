'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { Spinner } from '@/components/ui';

export default function OutreachPage() {
  const basePath = useBasePath();
  const router = useRouter();
  const [hasSenderEmail, setHasSenderEmail] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);

  const checkSenderEmail = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/email');
      const data = await res.json();
      setHasSenderEmail(data.hasPassword && !!data.senderEmail);
      setSenderEmail(data.senderEmail || '');
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSenderEmail();
  }, [checkSenderEmail]);

  const handleSend = async () => {
    const recipientList = recipients
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));

    if (recipientList.length === 0 || !subject.trim() || !body.trim()) return;

    setSending(true);
    setResults(null);

    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientList,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'no_sender_email') {
          setHasSenderEmail(false);
          return;
        }
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status === 'complete') {
              setResults({ sent: data.sent, failed: data.failed });
            }
          } catch {
            // Skip malformed
          }
        }
      }
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Email Outreach</h1>
        <p className="text-sm text-muted mt-1">
          Send personalized emails to your leads
        </p>
      </div>

      {!hasSenderEmail ? (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-warning">Sender email not set up</p>
              <p className="text-sm text-muted">
                Recipients will not receive your emails until you connect your email address.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`${basePath}/settings`)}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-text transition-colors"
          >
            Set up now →
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-success">
          <Check className="w-4 h-4" />
          Sending as: {senderEmail}
        </div>
      )}

      <div className="p-6 rounded-xl border border-border bg-surface space-y-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Recipients (one email per line)
          </label>
          <textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder={'email1@example.com\nemail2@example.com\nemail3@example.com'}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quick question about your business"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your outreach message here..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !hasSenderEmail || !recipients.trim() || !subject.trim() || !body.trim()}
          className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Emails
            </>
          )}
        </button>
      </div>

      {results && (
        <div className="p-6 rounded-xl border border-success/30 bg-success/5">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-text">Outreach Complete</h3>
          </div>
          <p className="text-sm text-muted">
            {results.sent} sent successfully
            {results.failed > 0 && `, ${results.failed} failed`}
          </p>
        </div>
      )}
    </div>
  );
}
