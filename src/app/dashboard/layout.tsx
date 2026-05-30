import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { Sidebar, BottomNav } from '@/components/dashboard/Sidebar';
import { CreditsBadge } from '@/components/dashboard/CreditsBadge';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('sparkleads_token')?.value;

  if (!token) {
    redirect('/#pricing');
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <Sidebar userToken={token} />

      <div className="lg:ml-60">
        <TopBar token={token} />

        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}

async function TopBar({ token }: { token: string }) {
  const { createSupabaseAdmin } = await import('@/lib/supabase');
  const supabase = createSupabaseAdmin();

  const { count } = await supabase
    .from('searches')
    .select('*', { count: 'exact', head: true })
    .eq('user_token', token);

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <h1 className="text-lg font-semibold text-text">Dashboard</h1>

      <div className="flex items-center gap-4">
        <CreditsBadge />

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2 text-sm text-muted">
          <Search className="w-4 h-4" />
          <span>{count ?? 0} searches run</span>
        </div>

        <button className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
