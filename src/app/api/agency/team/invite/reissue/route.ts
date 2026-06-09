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
  const { memberId } = body as { memberId?: string };

  if (!memberId) {
    return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Verify the member belongs to this workspace and is in invited status
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id, status, email, invite_token, role, name, credit_limit')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'invited')
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 });
  }

  // Generate new token and expiry
  const newInviteToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: updateError } = await supabase
    .from('workspace_members')
    .update({
      invite_token: newInviteToken,
      invite_expires_at: expiresAt.toISOString(),
    })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'invited');

  if (updateError) {
    return NextResponse.json({ error: 'Failed to reissue invite' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkleads.io';
  const inviteLink = `${appUrl}/join?token=${newInviteToken}`;

  // Log activity
  await logActivity({
    workspaceId,
    userToken: token,
    memberName: caller.name,
    action: `refreshed invite for ${member.email || 'team member'}`,
    resourceType: 'invite',
    resourceId: newInviteToken,
    metadata: { email: member.email, role: member.role },
  });

  return NextResponse.json({
    inviteLink,
    inviteToken: newInviteToken,
    expiresAt: expiresAt.toISOString(),
    role: member.role,
    creditLimit: member.credit_limit,
    email: member.email,
  });
}
