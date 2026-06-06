'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Zap, Loader2, CheckCircle, XCircle } from 'lucide-react';

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
  const [state, setState] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [workspaceName, setWorkspaceName] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('No invite token provided.');
      return;
    }
    fetch(`/api/agency/invite/verify?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setWorkspaceName(data.workspaceName || 'Agency');
          setState('form');
        } else {
          setState('error');
          setErrorMsg(data.error || 'Invalid or expired invite.');
        }
      })
      .catch(() => {
        setState('error');
        setErrorMsg('Failed to verify invite.');
      });
  }, [token]);

  const handleJoin = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/agency/invite/accept', {
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
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {state === 'loading' && (
          <div>
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted">Verifying invite...</p>
          </div>
        )}
        {state === 'form' && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-left">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-text">Join {workspaceName}</h1>
              <p className="text-sm text-muted mt-1">You&apos;ve been invited to join this workspace.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Your Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button onClick={handleJoin} disabled={submitting || !name.trim()} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Workspace'}
              </button>
            </div>
          </div>
        )}
        {state === 'success' && (
          <div>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Welcome aboard!</h1>
            <p className="text-muted">Redirecting to your agency dashboard...</p>
          </div>
        )}
        {state === 'error' && (
          <div>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Oops</h1>
            <p className="text-muted">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
