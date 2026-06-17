import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';
import {
  Search, Users, Settings, PieChart, CreditCard, Home,
  PenTool, Megaphone, Briefcase, MessageSquare, Bell,
  History, Sparkles, Globe, MapPin, FileText, Send, BarChart3,
} from 'lucide-react';

export default async function MorePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('sparkleads_token')?.value;
  const workspaceId = cookieStore.get('sparkleads_workspace')?.value;

  let role = 'member';
  if (token && workspaceId) {
    const supabase = createSupabaseAdmin();
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_token', token)
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .single();
    if (member) role = member.role;
  }

  const isOwnerOrManager = role === 'owner' || role === 'manager';

  const sections = [
    {
      title: 'Overview',
      items: [
        { href: '/agency', icon: <Home size={20} />, label: 'Dashboard' },
        { href: '/agency/analytics', icon: <PieChart size={20} />, label: 'Analytics' },
      ],
    },
    {
      title: 'Lead Generation',
      items: [
        { href: '/agency/search', icon: <Search size={20} />, label: 'Lead Search' },
        { href: '/agency/history', icon: <History size={20} />, label: 'Search History' },
        { href: '/agency/leads', icon: <BarChart3 size={20} />, label: 'My Leads' },
        { href: '/agency/reminders', icon: <Bell size={20} />, label: 'Reminders' },
      ],
    },
    {
      title: 'Website & SEO Audit',
      items: [
        { href: '/agency/audit/grade', icon: <Globe size={20} />, label: 'Website Grader' },
        { href: '/agency/audit/gbp', icon: <MapPin size={20} />, label: 'Google Profile' },
        { href: '/agency/audit/report', icon: <FileText size={20} />, label: 'Full Audit Report' },
        { href: '/agency/audit/competitors', icon: <Users size={20} />, label: 'Competitor Analysis' },
      ],
    },
    {
      title: 'Proposals & Briefs',
      items: [
        { href: '/agency/proposals', icon: <Briefcase size={20} />, label: 'Proposals' },
        { href: '/agency/briefs', icon: <Briefcase size={20} />, label: 'Creative Briefs' },
      ],
    },
    {
      title: 'Marketing & Content',
      items: [
        { href: '/agency/ads', icon: <Megaphone size={20} />, label: 'Ad Planner' },
        { href: '/agency/content', icon: <PenTool size={20} />, label: 'Content' },
      ],
    },
    {
      title: 'Outreach',
      items: [
        { href: '/agency/messages', icon: <MessageSquare size={20} />, label: 'AI Messages' },
        { href: '/agency/outreach', icon: <Send size={20} />, label: 'Email Outreach' },
      ],
    },
    ...(isOwnerOrManager ? [{
      title: 'Workspace',
      items: [
        ...(isOwnerOrManager ? [{ href: '/agency/team', icon: <Users size={20} />, label: 'Team' }] : []),
        ...(role === 'owner' ? [{ href: '/agency/billing', icon: <CreditCard size={20} />, label: 'Billing' }] : []),
        { href: '/agency/credits', icon: <Sparkles size={20} />, label: 'Credits' },
        { href: '/agency/settings', icon: <Settings size={20} />, label: 'Settings' },
      ],
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">More</h1>
        <p className="text-sm text-muted">All pages in your workspace</p>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">{section.title}</h2>
          <div className="grid grid-cols-2 gap-2">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface2 hover:border-primary/30 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-text">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
