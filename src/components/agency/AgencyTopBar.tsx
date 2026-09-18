'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, History, User } from 'lucide-react';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

interface TopBarProps {
  workspace: { name: string; credits_remaining: number };
  member: { name: string; role: string };
}

export function AgencyTopBar({ workspace, member }: TopBarProps) {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credits/ensure')
      .then((r) => r.json())
      .then((data) => setCredits(data.balance ?? 0))
      .catch(() => setCredits(member.role === 'member' ? 0 : workspace.credits_remaining));
  }, [workspace.credits_remaining, member.role]);

  const handleSwitchToPersonal = async () => {
    try {
      await fetch('/api/account/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: null }),
      });
      window.location.href = '/dashboard';
    } catch {
      window.location.href = '/dashboard';
    }
  };

  // Show 0 for members until API confirms their actual allocation
  const displayBalance = credits !== null
    ? credits
    : member.role === 'member'
      ? 0
      : workspace.credits_remaining;

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border h-14 lg:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 truncate">
        <h1 className="text-base lg:text-lg font-semibold text-text truncate">{workspace.name}</h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
          Agency Mode
        </span>
      </div>
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <button
          onClick={handleSwitchToPersonal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface2 text-muted hover:text-text hover:border-primary/50 transition-colors text-xs"
          title="Switch to Personal Dashboard"
        >
          <User className="w-3.5 h-3.5 text-primary" />
          <span className="hidden md:inline">Personal Mode</span>
          <span className="md:hidden">Personal</span>
        </button>
        <Link
          href="/agency/history"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
        >
          <History className="w-4 h-4" />
          <span className="text-xs">History</span>
        </Link>
        <Link
          href="/agency/credits"
          className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Zap className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-primary" />
          <span className="text-sm lg:text-sm font-semibold text-text">{displayBalance}</span>
          <span className="hidden sm:inline text-xs text-muted">credits</span>
        </Link>
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {member.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-text leading-tight">{member.name}</p>
            <p className="text-[10px] text-muted capitalize">{member.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
