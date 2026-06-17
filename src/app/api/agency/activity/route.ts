import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId, getWorkspaceMember } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const caller = await getWorkspaceMember(workspaceId, token);
  if (!caller) return NextResponse.json({ error: 'Member not found' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from('workspace_activity')
    .select('*')
    .eq('workspace_id', workspaceId);

  // Owners and managers see all activity, members see only their own
  if (caller.role === 'member') {
    query = query.eq('user_token', token);
  }

  const { data: activity } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  return NextResponse.json({ activity: activity || [] });
}
