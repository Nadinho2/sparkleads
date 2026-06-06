import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId, getWorkspaceMember } from '@/lib/agency-auth';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace' }, { status: 400 });
  }

  const caller = await getWorkspaceMember(workspaceId, token);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'manager')) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role, creditLimit } = body as {
    email: string;
    role?: string;
    creditLimit?: number;
  };

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check seat limit
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('seats_limit')
    .eq('id', workspaceId)
    .single();

  const { count } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .in('status', ['active', 'invited']);

  if (workspace && count !== null && count >= workspace.seats_limit) {
    return NextResponse.json({ error: 'Seat limit reached. Upgrade your plan.' }, { status: 400 });
  }

  // Check if already invited
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already invited or a member' }, { status: 409 });
  }

  const inviteToken = uuidv4();

  await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_token: `invited_${inviteToken.slice(0, 8)}`,
    email,
    name: email.split('@')[0],
    role: role || 'member',
    credit_limit: creditLimit || 0,
    status: 'invited',
    invite_token: inviteToken,
  });

  return NextResponse.json({
    success: true,
    inviteToken,
    inviteLink: `/join?token=${inviteToken}`,
  });
}
