'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type ActivationState = 'loading' | 'success' | 'error';

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<ActivationState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const activated = useRef(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('No activation token provided.');
      return;
    }

    if (activated.current) return;
    activated.current = true;

    async function activate() {
      try {
        const response = await fetch(`/api/activate?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setState('success');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else if (response.status === 400 && data.error === 'Token already used') {
          setState('error');
          setErrorMessage('This activation link has already been used.');
        } else {
          setState('error');
          setErrorMessage('This activation link is invalid or already used.');
        }
      } catch {
        setState('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    }

    activate();
  }, [token]);

  return (
    <main className="min-h-screen bg-background text-text flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {state === 'loading' && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Activating your account...
            </h1>
            <p className="text-muted">This will only take a moment.</p>
          </div>
        )}

        {state === 'success' && (
          <div className="animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Your SparkLeads account is ready!
            </h1>
            <p className="text-muted mb-6">
              Redirecting you to your dashboard in a few seconds...
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-5 h-5" />
              Go to Dashboard
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-danger" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Activation Failed
            </h1>
            <p className="text-muted mb-8">{errorMessage}</p>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Checkout
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
