'use client';

import Link from 'next/link';
import { Zap, Bell, History } from 'lucide-react';

interface TopBarProps {
  workspace: { name: string; credits_remaining: number };
  member: { name: string; role: string };
}

export function AgencyTopBar({ workspace, member }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border h-14 lg:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8">
      <h1 className="text-base lg:text-lg font-semibold text-text truncate">{workspace.name}</h1>
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
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
          <span className="text-sm lg:text-sm font-semibold text-text">{workspace.credits_remaining}</span>
          <span className="hidden sm:inline text-xs text-muted">credits</span>
        </Link>
        <button className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
          <Bell className="w-4 lg:w-5 h-4 lg:h-5" />
        </button>
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
