'use client';

import { Zap } from 'lucide-react';

interface TopBarProps {
  workspace: { name: string; credits_remaining: number };
  member: { name: string; role: string };
}

export function AgencyTopBar({ workspace, member }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <h1 className="text-lg font-semibold text-text">{workspace.name}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text">{workspace.credits_remaining}</span>
          <span className="text-xs text-muted">credits</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text">{member.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface2 text-muted capitalize">{member.role}</span>
        </div>
      </div>
    </header>
  );
}
