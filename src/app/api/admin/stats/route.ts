import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  try {
    // Run stat queries in parallel
    const [
      activationsRes,
      creditsRes,
      workspacesRes,
      membersRes,
      searchesRes,
      leadsRes,
      payoutsRes,
    ] = await Promise.all([
      supabase.from('activations').select('id, used', { count: 'exact' }),
      supabase.from('user_credits').select('balance'),
      supabase.from('workspaces').select('id, status, credits_remaining'),
      supabase.from('workspace_members').select('id, status', { count: 'exact' }),
      supabase.from('searches').select('id, result_count'),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('payout_requests').select('amount, status'),
    ]);

    const totalUsers = activationsRes.count || 0;
    const activeUsers = (activationsRes.data || []).filter((a) => a.used).length;

    const userCreditsPool = (creditsRes.data || []).reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
    const workspaceCreditsPool = (workspacesRes.data || []).reduce((acc, curr) => acc + (Number(curr.credits_remaining) || 0), 0);
    const totalCreditsCirculating = userCreditsPool + workspaceCreditsPool;

    const totalWorkspaces = workspacesRes.data?.length || 0;
    const activeWorkspaces = (workspacesRes.data || []).filter((w) => w.status === 'active').length;
    const totalTeamMembers = membersRes.count || 0;

    const totalSearches = searchesRes.data?.length || 0;
    const totalLeadsFound = leadsRes.count || 0;

    const pendingPayouts = (payoutsRes.data || []).filter((p) => p.status === 'pending');
    const pendingPayoutsAmount = pendingPayouts.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalWorkspaces,
        activeWorkspaces,
        totalTeamMembers,
        totalCreditsCirculating,
        userCreditsPool,
        workspaceCreditsPool,
        totalSearches,
        totalLeadsFound,
        pendingPayoutsCount: pendingPayouts.length,
        pendingPayoutsAmount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
