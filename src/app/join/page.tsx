'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Loader2, CheckCircle, XCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

interface InviteData {
  valid: boolean;
  error?: string;
  message?: string;
  workspaceName?: string;
  workspaceLogo?: string | null;
  role?: string;
  inviterName?: string;
  email?: string;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setInvite({ valid: false, error: 'no_token', message: 'No invite token provided.' });
      setVerifying(false);
      return;
    }

    fetch(`/api/agency/team/invite/verify?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          try { return JSON.parse(text); } catch { return { valid: false, message: 'Server error' }; }
        }
        return r.json();
      })
      .then((data) => {
        setInvite(data);
        setVerifying(false);
      })
      .catch(() => {
        setInvite({ valid: false, error: 'network', message: 'Failed to verify invite.' });
        setVerifying(false);
      });
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim() || !password) return;

    setJoining(true);
    setError('');

    try {
      const res = await fetch('/api/agency/team/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setJoined(true);
        setTimeout(() => {
          window.location.href = '/agency';
        }, 1500);
      } else {
        setError(data.error || 'Failed to join workspace');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setJoining(false);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm">Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (!invite?.valid) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">This Link is Not Valid</h1>
          <p className="text-muted text-sm mb-6">
            {invite?.message || 'This invite link is invalid or has expired. Please ask your agency owner for a new invite.'}
          </p>
          <a
            href="/"
            className="px-4 py-2.5 rounded-lg bg-surface border border-border text-sm font-medium text-text hover:bg-surface2 transition-colors"
          >
            Go to SparkLeads
          </a>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">Welcome to {invite.workspaceName}!</h1>
          <p className="text-muted text-sm">Redirecting you to your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-text">SparkLeads</span>
        </div>

        {/* Invite Card */}
        <div className="p-6 rounded-2xl border border-border bg-surface mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {invite.workspaceLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={invite.workspaceLogo} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <UserPlus className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted">{invite.inviterName} invited you to join</p>
              <p className="text-lg font-bold text-text">{invite.workspaceName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {invite.role}
            </span>
            {invite.email && (
              <span className="px-2 py-0.5 rounded-full bg-surface2 text-muted text-xs">
                {invite.email}
              </span>
            )}
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-surface2 border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg bg-surface2 border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={joining || !name.trim() || password.length < 8}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Workspace'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
