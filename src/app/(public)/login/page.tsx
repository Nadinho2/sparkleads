'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, Eye, EyeOff, Zap, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Team member login state
  const [memberName, setMemberName] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [memberLoginLoading, setMemberLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!memberPassword.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setMemberLoginLoading(true);

    try {
      const response = await fetch('/api/agency/team/member-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: memberName.trim(), password: memberPassword.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Welcome back!');
        router.push('/agency');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setMemberLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <div className="p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-text">SparkLeads</span>
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-8">
        <div className="w-full max-w-md space-y-8">

          {/* Main Login */}
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
                Welcome back
              </h1>
              <p className="text-sm sm:text-base text-muted">
                Log in to access your leads and campaigns
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Logging in...' : 'Log In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted">
                Don&apos;t have an account?{' '}
                <Link href="/checkout" className="text-primary hover:underline font-medium">
                  Get access for ₦19,900
                </Link>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted">or</span>
            </div>
          </div>

          {/* Team Member Login */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-primary" />
              <h2 className="text-sm font-semibold text-text">Team Member Login</h2>
            </div>
            <p className="text-xs text-muted mb-4">
              Log in with your team name and password if you were invited to an agency workspace.
            </p>
            <form onSubmit={handleMemberLogin} className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Your Name</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showMemberPassword ? 'text' : 'password'}
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pr-10 px-3 py-2.5 bg-surface2 border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMemberPassword(!showMemberPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showMemberPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={memberLoginLoading}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {memberLoginLoading ? 'Logging in...' : <><Users size={15} /> Team Login</>}
              </button>
            </form>
            <p className="text-xs text-muted mt-3 text-center">
              Don&apos;t have an account yet? Ask your agency owner for an invite link.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
