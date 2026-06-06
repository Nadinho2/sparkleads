import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId, getWorkspaceMember } from '@/lib/agency-auth';
import { logActivity } from '@/lib/activity-logger';

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
  const { role, name, creditLimit } = body as {
    role?: 'manager' | 'member';
    name?: string;
    creditLimit?: number;
  };

  const supabase = createSupabaseAdmin();

  // Check seat limit
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('seats_limit, name')
    .eq('id', workspaceId)
    .single();

  const { count } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .in('status', ['active', 'invited']);

  if (workspace && count !== null && count >= workspace.seats_limit) {
    return NextResponse.json({
      error: 'seat_limit_reached',
      message: 'You have used all available seats. Upgrade to add more.',
    }, { status: 403 });
  }

  const inviteToken = crypto.randomUUID();

  // Calculate expiry (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    invite_token: inviteToken,
    role: role || 'member',
    name: name || 'Team Member',
    credit_limit: creditLimit || 0,
    status: 'invited',
    email: null,
    user_token: null,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkleads.io';
  const inviteLink = `${appUrl}/join?token=${inviteToken}`;

  // Log activity
  await logActivity({
    workspaceId,
    userToken: token,
    memberName: caller.name,
    action: `generated a ${role || 'member'} invite link`,
    resourceType: 'invite',
    resourceId: inviteToken,
  });

  return NextResponse.json({
    inviteLink,
    inviteToken,
    expiresAt: expiresAt.toISOString(),
    role: role || 'member',
    creditLimit: creditLimit || 0,
  });
}
