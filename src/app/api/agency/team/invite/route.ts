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
  const { role, name, creditLimit, email } = body as {
    role?: 'manager' | 'member';
    name?: string;
    creditLimit?: number;
    email?: string;
  };

  if (!email || !email.trim()) {
    return NextResponse.json({ error: 'Email is required to send an invite' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const supabase = createSupabaseAdmin();

  // Check if this email is already an active member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id, status')
    .eq('workspace_id', workspaceId)
    .eq('email', normalizedEmail)
    .in('status', ['active', 'invited'])
    .limit(1)
    .single();

  if (existingMember) {
    if (existingMember.status === 'active') {
      return NextResponse.json({ error: 'This person is already an active member' }, { status: 409 });
    }
    if (existingMember.status === 'invited') {
      return NextResponse.json({ error: 'An invite has already been sent to this email' }, { status: 409 });
    }
  }

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

  // creditLimit of 0 means 0 credits (no free credits), not unlimited
  const finalCreditLimit = creditLimit !== undefined ? creditLimit : 0;

  await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    invite_token: inviteToken,
    role: role || 'member',
    name: name || 'Team Member',
    email: normalizedEmail,
    credit_limit: finalCreditLimit,
    status: 'invited',
    user_token: null,
    invite_expires_at: expiresAt.toISOString(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkleads.io';
  const inviteLink = `${appUrl}/join?token=${inviteToken}`;

  // Log activity
  await logActivity({
    workspaceId,
    userToken: token,
    memberName: caller.name,
    action: `invited ${normalizedEmail} as ${role || 'member'}`,
    resourceType: 'invite',
    resourceId: inviteToken,
    metadata: { email: normalizedEmail, role: role || 'member', creditLimit: finalCreditLimit },
  });

  return NextResponse.json({
    inviteLink,
    inviteToken,
    expiresAt: expiresAt.toISOString(),
    role: role || 'member',
    creditLimit: finalCreditLimit,
    email: normalizedEmail,
  });
}
