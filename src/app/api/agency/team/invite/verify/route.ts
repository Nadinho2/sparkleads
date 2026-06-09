import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // First try with invite_expires_at, fall back without it if column doesn't exist
  let member: Record<string, unknown> | null = null;
  const { data: m1, error: e1 } = await supabase
    .from('workspace_members')
    .select('id, status, workspace_id, role, name, email, created_at, invite_expires_at, workspaces(name, logo_url)')
    .eq('invite_token', token)
    .single();

  if (e1 && e1.message?.includes('invite_expires_at')) {
    // Column doesn't exist yet, retry without it
    const { data: m2 } = await supabase
      .from('workspace_members')
      .select('id, status, workspace_id, role, name, email, created_at, workspaces(name, logo_url)')
      .eq('invite_token', token)
      .single();
    member = m2;
  } else {
    member = m1;
  }

  if (!member) {
    return NextResponse.json({ valid: false, error: 'not_found', message: 'Invite not found.' }, { status: 404 });
  }

  if (member.status === 'revoked') {
    return NextResponse.json({ valid: false, error: 'revoked', message: 'This invite has been revoked.' }, { status: 410 });
  }

  if (member.status === 'active') {
    return NextResponse.json({ valid: false, error: 'already_used', message: 'This invite has already been accepted.' }, { status: 409 });
  }

  // Check expiry — use stored invite_expires_at if available, otherwise fall back to created_at + 7 days
  let expiresAt: Date;
  if (member.invite_expires_at) {
    expiresAt = new Date(member.invite_expires_at as string);
  } else {
    const createdAt = new Date((member.created_at as string) || Date.now());
    expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  if (new Date() > expiresAt) {
    return NextResponse.json({ valid: false, error: 'expired', message: 'This invite link has expired.' }, { status: 410 });
  }

  const workspace = member.workspaces as unknown as { name: string; logo_url: string | null } | null;

  // Get inviter name (workspace owner)
  const { data: workspaceData } = await supabase
    .from('workspaces')
    .select('owner_token')
    .eq('id', member.workspace_id as string)
    .single();

  let inviterName = 'Your team';
  if (workspaceData?.owner_token) {
    const { data: owner } = await supabase
      .from('workspace_members')
      .select('name')
      .eq('workspace_id', member.workspace_id as string)
      .eq('user_token', workspaceData.owner_token)
      .single();
    if (owner) inviterName = owner.name;
  }

  return NextResponse.json({
    valid: true,
    workspaceName: workspace?.name || 'Agency',
    workspaceLogo: workspace?.logo_url || null,
    role: member.role,
    inviterName,
    email: member.email || null,
  });
}
