import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Users, Settings, PieChart, CreditCard, Home,
  PenTool, Megaphone, Briefcase, MessageSquare, Bell,
  History, Sparkles, Globe, MapPin, FileText, Send, BarChart3,
} from 'lucide-react';
import { createSupabaseAdmin } from '@/lib/supabase';
import { AgencyTopBar } from '@/components/agency/AgencyTopBar';
import { Footer } from '@/components/layout/Footer';

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('sparkleads_token')?.value;
  const workspaceId = cookieStore.get('sparkleads_workspace')?.value;

  if (!token) redirect('/freetrial');
  if (!workspaceId) redirect('/dashboard');

  const supabase = createSupabaseAdmin();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('*, workspaces(*)')
    .eq('user_token', token)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .single();

  if (!member || !member.workspaces) redirect('/dashboard');

  const workspace = member.workspaces as unknown as { id: string; name: string; logo_url: string | null; brand_color: string; credits_remaining: number; seats_limit: number };
  const role = member.role as string;

  const navSections = [
    {
      section: 'Overview',
      items: [
        { href: '/agency', icon: <Home size={16} />, label: 'Dashboard' },
        { href: '/agency/analytics', icon: <PieChart size={16} />, label: 'Analytics' },
      ],
    },
    {
      section: 'Lead Generation',
      items: [
        { href: '/agency/search', icon: <Search size={16} />, label: 'Lead Search' },
        { href: '/agency/history', icon: <History size={16} />, label: 'Search History' },
        { href: '/agency/leads', icon: <BarChart3 size={16} />, label: 'My Leads' },
        { href: '/agency/reminders', icon: <Bell size={16} />, label: 'Reminders' },
      ],
    },
    {
      section: 'Website & SEO Audit',
      items: [
        { href: '/agency/audit/grade', icon: <Globe size={16} />, label: 'Website Grader' },
        { href: '/agency/audit/gbp', icon: <MapPin size={16} />, label: 'Google Profile' },
        { href: '/agency/audit/report', icon: <FileText size={16} />, label: 'Full Audit Report' },
        { href: '/agency/audit/competitors', icon: <Users size={16} />, label: 'Competitor Analysis' },
      ],
    },
    {
      section: 'Proposals & Briefs',
      items: [
        { href: '/agency/proposals', icon: <Briefcase size={16} />, label: 'Proposals' },
        { href: '/agency/briefs', icon: <Briefcase size={16} />, label: 'Creative Briefs' },
      ],
    },
    {
      section: 'Marketing & Content',
      items: [
        { href: '/agency/ads', icon: <Megaphone size={16} />, label: 'Ad Planner' },
        { href: '/agency/content', icon: <PenTool size={16} />, label: 'Content' },
      ],
    },
    {
      section: 'Outreach',
      items: [
        { href: '/agency/messages', icon: <MessageSquare size={16} />, label: 'AI Messages' },
        { href: '/agency/outreach', icon: <Send size={16} />, label: 'Email Outreach' },
      ],
    },
  ];

  const bottomItems = [
    ...(role === 'owner' || role === 'manager' ? [
      { href: '/agency/team', icon: <Users size={16} />, label: 'Team' },
    ] : []),
    ...(role === 'owner' ? [
      { href: '/agency/billing', icon: <CreditCard size={16} />, label: 'Billing' },
    ] : []),
    { href: '/agency/credits', icon: <Sparkles size={16} />, label: 'Credits' },
    { href: '/agency/settings', icon: <Settings size={16} />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-surface border-r border-border">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          {workspace.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspace.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: workspace.brand_color }}>
              {workspace.name.charAt(0)}
            </div>
          )}
          <span className="text-sm font-bold text-text truncate">{workspace.name}</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.section}>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 mb-2">{section.section}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-3 border-t border-border space-y-0.5">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 mb-2">Workspace</p>
          {bottomItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </div>
      </aside>

      <div className="lg:ml-60 flex-1 flex flex-col min-h-screen">
        <AgencyTopBar workspace={workspace} member={member} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface border-t border-border flex items-center justify-around px-1 pb-2">
        <MobileNavLink href="/agency" icon={<Home size={20} />} label="Home" />
        <MobileNavLink href="/agency/search" icon={<Search size={20} />} label="Search" />
        <MobileNavLink href="/agency/leads" icon={<Users size={20} />} label="Leads" />
        <MobileNavLink href="/agency/audit/grade" icon={<Globe size={20} />} label="Audit" />
        <MobileNavLink href="/agency/proposals" icon={<Briefcase size={20} />} label="Proposals" />
        <MobileNavLink href="/agency/messages" icon={<MessageSquare size={20} />} label="Messages" />
        <MobileNavLink href="/agency/settings" icon={<Settings size={20} />} label="More" />
      </nav>
    </div>
  );

  function MobileNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
      <Link href={href} className="flex flex-col items-center gap-0.5 py-2 px-3 text-muted hover:text-text transition-colors min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
      </Link>
    );
  }
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-surface2 transition-colors">
      {icon}
      {label}
    </Link>
  );
}
