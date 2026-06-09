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

  const { data: member } = await supabase
    .from('workspace_members')
    .select('id, status, workspace_id, role, name, created_at, invite_expires_at, workspaces(name, logo_url)')
    .eq('invite_token', token)
    .single();

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
    expiresAt = new Date(member.invite_expires_at);
  } else {
    const createdAt = new Date(member.created_at || Date.now());
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
    .eq('id', member.workspace_id)
    .single();

  let inviterName = 'Your team';
  if (workspaceData?.owner_token) {
    const { data: owner } = await supabase
      .from('workspace_members')
      .select('name')
      .eq('workspace_id', member.workspace_id)
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
  });
}
