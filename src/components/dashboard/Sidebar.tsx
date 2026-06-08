'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, Search, History, BarChart3, Users, Settings, LogOut, Bell,
  Megaphone, Target, Bookmark, ChevronDown, PenTool, BookOpen,
  CalendarDays, Sparkles, MapPin, FileText, MessageSquare,
  Briefcase, PieChart, Building2, Globe, Send,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: typeof Search;
  badge?: string;
  children?: { label: string; href: string; icon: typeof Search }[];
}

const navSections: { section: string; items: NavItem[] }[] = [
  {
    section: 'Lead Generation',
    items: [
      { label: 'New Search', href: '/dashboard', icon: Search },
      { label: 'Search History', href: '/dashboard/history', icon: History },
      { label: 'My Leads', href: '/dashboard/leads', icon: BarChart3 },
      { label: 'Reminders', href: '/dashboard/reminders', icon: Bell },
    ],
  },
  {
    section: 'Website & SEO Audit',
    items: [
      { label: 'Website Grader', href: '/dashboard/audit/grade', icon: Globe },
      { label: 'Google Profile', href: '/dashboard/audit/gbp', icon: MapPin },
      { label: 'Full Audit Report', href: '/dashboard/audit/report', icon: FileText },
      { label: 'Competitor Analysis', href: '/dashboard/audit/competitors', icon: Users },
    ],
  },
  {
    section: 'Proposals & Briefs',
    items: [
      { label: 'Proposals', href: '/dashboard/proposals', icon: FileText },
      { label: 'Creative Briefs', href: '/dashboard/briefs', icon: Briefcase },
    ],
  },
  {
    section: 'Marketing & Content',
    items: [
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
    ],
  },
  {
    section: 'Outreach',
    items: [
      {
        label: 'AI Messages',
        icon: MessageSquare,
        children: [
          { label: 'Write Messages', href: '/dashboard/messages', icon: MessageSquare },
          { label: 'Message History', href: '/dashboard/messages/history', icon: History },
        ],
      },
      { label: 'Email Outreach', href: '/dashboard/outreach/email', icon: Send },
    ],
  },
];

const bottomItems: NavItem[] = [
  { label: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
  { label: 'Credits', href: '/dashboard/credits', icon: Zap },
  { label: 'Affiliate', href: '/dashboard/affiliate', icon: Users },
  { label: 'Agency Workspace', href: '/onboarding', icon: Building2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  userToken: string;
}

export function Sidebar({ userToken }: SidebarProps) {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Ad Planner': pathname.startsWith('/dashboard/ads'),
    'Content': pathname.startsWith('/dashboard/content'),
    'AI Messages': pathname.startsWith('/dashboard/messages'),
  });

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

  function toggleExpand(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isItemActive(item: NavItem): boolean {
    if (item.href) {
      return item.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(item.href);
    }
    if (item.children) {
      return item.children.some((c) => pathname.startsWith(c.href));
    }
    return false;
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

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.section}>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 mb-2">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (item.children) {
                  const isActive = isItemActive(item);
                  const isOpen = expanded[item.label] ?? false;
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted hover:text-text hover:bg-surface2'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href || (child.href !== '/dashboard/ads' && pathname.startsWith(child.href));
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  isChildActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted hover:text-text hover:bg-surface2'
                                }`}
                              >
                                <child.icon className="w-3.5 h-3.5" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = isItemActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted hover:text-text hover:bg-surface2'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {item.href === '/dashboard/credits' && balance !== null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        balance === 0 ? 'bg-red-500/20 text-red-400'
                        : balance < 10 ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                      }`}>
                        {balance}
                      </span>
                    )}
                    {item.href === '/dashboard/reminders' && reminderCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        {reminderCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = item.href ? pathname.startsWith(item.href) : false;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              {item.href === '/dashboard/credits' && balance !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  balance === 0 ? 'bg-red-500/20 text-red-400'
                  : balance < 10 ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
                }`}>
                  {balance}
                </span>
              )}
            </Link>
          );
        })}
        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-surface2 flex items-center justify-center text-[10px] font-mono text-muted">
            {userToken.slice(0, 6)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted truncate font-mono">{userToken.slice(0, 8)}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const quickItems = [
    { label: 'Search', href: '/dashboard', icon: Search },
    { label: 'Leads', href: '/dashboard/leads', icon: BarChart3 },
    { label: 'Grade', href: '/dashboard/audit/grade', icon: Globe },
    { label: 'Proposals', href: '/dashboard/proposals', icon: FileText },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'More', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {quickItems.map((item) => {
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
