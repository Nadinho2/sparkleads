import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Settings, PieChart, CreditCard, Home, CheckSquare } from 'lucide-react';
import { createSupabaseAdmin } from '@/lib/supabase';
import { AgencyTopBar } from '@/components/agency/AgencyTopBar';

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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink href="/agency" icon={<Home size={18} />} label="Overview" />
          <NavLink href="/agency/search" icon={<Search size={18} />} label="Lead Search" />
          <NavLink href="/agency/clients" icon={<Users size={18} />} label="Clients" />
          <NavLink href="/agency/tasks" icon={<CheckSquare size={18} />} label="My Tasks" />
          <NavLink href="/agency/analytics" icon={<PieChart size={18} />} label="Analytics" />
          {(role === 'owner' || role === 'manager') && (
            <NavLink href="/agency/team" icon={<Users size={18} />} label="Team" />
          )}
          {role === 'owner' && (
            <NavLink href="/agency/billing" icon={<CreditCard size={18} />} label="Billing" />
          )}
          <NavLink href="/agency/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>
      </aside>

      <div className="lg:ml-60 flex-1 flex flex-col">
        <AgencyTopBar workspace={workspace} member={member} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface border-t border-border flex items-center justify-around px-1 pb-2">
        <MobileNavLink href="/agency" icon={<Home size={20} />} label="Home" />
        <MobileNavLink href="/agency/search" icon={<Search size={20} />} label="Search" />
        <MobileNavLink href="/agency/clients" icon={<Users size={20} />} label="Clients" />
        <MobileNavLink href="/agency/analytics" icon={<PieChart size={20} />} label="Analytics" />
        {(role === 'owner' || role === 'manager') && (
          <MobileNavLink href="/agency/team" icon={<Users size={20} />} label="Team" />
        )}
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
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-text hover:bg-surface2 transition-colors">
      {icon}
      {label}
    </Link>
  );
}
