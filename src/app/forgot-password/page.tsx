'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, ArrowRight, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.reset_url) {
          setResetUrl(data.reset_url);
        } else {
          toast.success('If an account exists, a reset link has been sent to your email.');
        }
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    toast.success('Reset link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (resetUrl) {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col">
        <div className="p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-text">SparkLeads</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Reset link generated</h1>
            <p className="text-muted mb-6 text-sm">
              Click the button below to reset your password. This link expires in 1 hour.
            </p>

            <a
              href={resetUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors mb-4"
            >
              Reset Password
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="mt-4">
              <button
                onClick={copyUrl}
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            <div className="mt-8">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <div className="p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-text">SparkLeads</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
              Forgot your password?
            </h1>
            <p className="text-sm sm:text-base text-muted">
              Enter your email and we&apos;ll generate a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Generating...' : 'Generate Reset Link'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
