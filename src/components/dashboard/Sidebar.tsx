'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Zap, Search, History, BarChart3, Users, Settings, LogOut, Bell, Megaphone, Target, Bookmark, ChevronDown, PenTool, BookOpen, CalendarDays, Sparkles, BarChart2, MapPin, FileText } from 'lucide-react';

const navItems = [
  { label: 'New Search', href: '/dashboard', icon: Search },
  { label: 'Search History', href: '/dashboard/history', icon: History },
  { label: 'My Leads', href: '/dashboard/leads', icon: BarChart3 },
  { label: 'Reminders', href: '/dashboard/reminders', icon: Bell },
  {
    label: 'Ad Planner',
    icon: Megaphone,
    children: [
      { label: 'New Plan', href: '/dashboard/ads', icon: Target },
      { label: 'Saved Plans', href: '/dashboard/ads/history', icon: Bookmark },
    ],
  },
  {
    label: 'Content',
    icon: PenTool,
    children: [
      { label: 'Generate', href: '/dashboard/content', icon: Sparkles },
      { label: 'Library', href: '/dashboard/content/library', icon: BookOpen },
      { label: 'Calendar', href: '/dashboard/content/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Agency Tools',
    icon: BarChart2,
    children: [
      { label: 'Website Grader', href: '/dashboard/audit/grade', icon: BarChart2 },
      { label: 'GBP Auditor', href: '/dashboard/audit/gbp', icon: MapPin },
      { label: 'Competitors', href: '/dashboard/audit/competitors', icon: Users },
      { label: 'Audit Report', href: '/dashboard/audit/report', icon: FileText },
    ],
  },
  { label: 'Credits', href: '/dashboard/credits', icon: Zap },
  { label: 'Affiliate', href: '/dashboard/affiliate', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  userToken: string;
}

export function Sidebar({ userToken }: SidebarProps) {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [adsExpanded, setAdsExpanded] = useState(pathname.startsWith('/dashboard/ads'));
  const [contentExpanded, setContentExpanded] = useState(pathname.startsWith('/dashboard/content'));
  const [agencyExpanded, setAgencyExpanded] = useState(pathname.startsWith('/dashboard/audit'));

  useEffect(() => {
    fetch('/api/credits/ensure')
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(0));

    fetch('/api/reminders/list?status=pending')
      .then((res) => res.json())
      .then((data) => {
        const today = new Date().toISOString().split('T')[0];
        const due = (data.reminders || []).filter(
          (r: { due_date: string; status: string }) =>
            r.status === 'pending' && r.due_date <= today
        );
        setReminderCount(due.length);
      })
      .catch(() => setReminderCount(0));
  }, []);

  function handleLogout() {
    document.cookie = 'sparkleads_token=; path=/; max-age=0';
    window.location.href = '/#pricing';
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-surface border-r border-border">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-text">SparkLeads</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if ('children' in item && item.children) {
            const isSectionActive = item.children.some((child) => pathname.startsWith(child.href));
            const isExpanded = item.label === 'Content'
              ? contentExpanded
              : item.label === 'Agency Tools'
                ? agencyExpanded
                : adsExpanded;
            const toggle = item.label === 'Content'
              ? () => setContentExpanded(!contentExpanded)
              : item.label === 'Agency Tools'
                ? () => setAgencyExpanded(!agencyExpanded)
                : () => setAdsExpanded(!adsExpanded);
            return (
              <div key={item.label}>
                <button
                  onClick={toggle}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isSectionActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-text hover:bg-surface2'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href || (child.href !== '/dashboard/ads' && pathname.startsWith(child.href));
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isChildActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted hover:text-text hover:bg-surface2'
                          }`}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const href = 'href' in item ? item.href : '';
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
              {href === '/dashboard/credits' && balance !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  balance === 0
                    ? 'bg-red-500/20 text-red-400'
                    : balance < 10
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                }`}>
                  {balance}
                </span>
              )}
              {href === '/dashboard/reminders' && reminderCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                  {reminderCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-mono text-muted">
            {userToken.slice(0, 8)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted truncate font-mono">{userToken.slice(0, 8)}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const flatItems = navItems.flatMap((item) => {
    if ('children' in item && item.children) {
      return item.children.map((child) => ({
        label: child.label,
        href: child.href,
        icon: child.icon,
      }));
    }
    return [{ label: item.label, href: 'href' in item ? item.href : '', icon: item.icon }];
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 overflow-x-auto">
        {flatItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
