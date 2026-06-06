import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET() {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const [{ count: totalClients }, { count: activeClients }, { data: workspace }, { count: memberCount }] = await Promise.all([
    supabase.from('agency_clients').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('agency_clients').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'active'),
    supabase.from('workspaces').select('monthly_credits, credits_remaining').eq('id', workspaceId).single(),
    supabase.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'active'),
  ]);

  const creditsUsed = (workspace?.monthly_credits || 0) - (workspace?.credits_remaining || 0);

  return NextResponse.json({
    totalClients: totalClients || 0,
    activeClients: activeClients || 0,
    leadsThisMonth: 0,
    creditsUsed,
    memberCount: memberCount || 0,
  });
}
