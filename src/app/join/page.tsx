'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Building2 } from 'lucide-react';

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <JoinContent />
    </Suspense>
  );
}

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<'loading' | 'form' | 'success' | 'error' | 'already_used'>('loading');
  const [inviteData, setInviteData] = useState<{
    workspaceName: string;
    workspaceLogo: string | null;
    role: string;
    inviterName: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('No invite token provided.');
      return;
    }
    fetch(`/api/agency/team/invite/verify?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setInviteData(data);
          setState('form');
        } else if (data.error === 'already_used') {
          setState('already_used');
        } else {
          setState('error');
          setErrorMsg(data.message || 'This invite link is no longer valid.');
        }
      })
      .catch(() => {
        setState('error');
        setErrorMsg('Failed to verify invite.');
      });
  }, [token]);

  const acceptInvite = async () => {
    if (!name.trim() || password.length < 8) return;
    setIsJoining(true);
    try {
      const res = await fetch('/api/agency/team/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('success');
        setTimeout(() => router.push('/agency'), 2000);
      } else {
        setErrorMsg(data.error || 'Failed to join');
        setState('error');
      }
    } catch {
      setErrorMsg('Something went wrong');
      setState('error');
    }
    setIsJoining(false);
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading */}
        {state === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted">Verifying invite...</p>
          </div>
        )}

        {/* Valid invite — setup form */}
        {state === 'form' && inviteData && (
          <div className="space-y-6">
            {/* Agency branding */}
            <div className="text-center">
              {inviteData.workspaceLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inviteData.workspaceLogo} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 size={28} className="text-primary" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-text">You&apos;re invited!</h1>
              <p className="text-muted mt-2">
                Join <strong className="text-text">{inviteData.workspaceName}</strong> on SparkLeads as a{' '}
                <strong className="text-text capitalize">{inviteData.role}</strong>
              </p>
            </div>

            {/* Setup form */}
            <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
              <h2 className="font-semibold text-text">Set up your account</h2>

              <div>
                <label className="text-xs text-muted mb-1 block">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amaka Johnson"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface2 border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Create a Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface2 border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                onClick={acceptInvite}
                disabled={!name.trim() || password.length < 8 || isJoining}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isJoining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : `Join ${inviteData.workspaceName} →`}
              </button>

              <p className="text-xs text-muted text-center">
                By joining you agree to SparkLeads terms of service
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Welcome aboard!</h1>
            <p className="text-muted">Redirecting to your agency dashboard...</p>
          </div>
        )}

        {/* Already used */}
        {state === 'already_used' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🔗</div>
            <h1 className="text-2xl font-bold text-text">This invite has already been accepted</h1>
            <p className="text-muted">If that was you, go to login instead.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Error / Expired / Revoked */}
        {state === 'error' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🔗</div>
            <h1 className="text-2xl font-bold text-text">This invite link is no longer valid</h1>
            <p className="text-muted">
              {errorMsg || 'This link may have expired or been revoked. Ask your agency owner for a new invite link.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
