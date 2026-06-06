import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId, getWorkspaceMember } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET() {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const caller = await getWorkspaceMember(workspaceId, token);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'manager')) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const supabase = createSupabaseAdmin();

  const { data: invites } = await supabase
    .from('workspace_members')
    .select('id, invite_token, role, name, credit_limit, status, created_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'invited')
    .order('created_at', { ascending: false });

  return NextResponse.json({ invites: invites || [] });
}

export async function DELETE(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const caller = await getWorkspaceMember(workspaceId, token);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'manager')) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const inviteToken = searchParams.get('token');
  if (!inviteToken) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('workspace_members')
    .update({ status: 'revoked' })
    .eq('workspace_id', workspaceId)
    .eq('invite_token', inviteToken)
    .eq('status', 'invited');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
