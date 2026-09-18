import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId, getWorkspaceMember } from '@/lib/agency-auth';
import { logActivity } from '@/lib/activity-logger';

export const runtime = 'nodejs';

export async function GET() {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: members } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('seats_limit')
    .eq('id', workspaceId)
    .single();

  return NextResponse.json({
    members: members || [],
    seatsLimit: workspace?.seats_limit || 3,
  });
}

export async function PATCH(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const caller = await getWorkspaceMember(workspaceId, token);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'manager')) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const { memberId, role, creditLimit, status } = body as {
    memberId: string;
    role?: string;
    creditLimit?: number;
    status?: string;
  };

  const supabase = createSupabaseAdmin();
  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (creditLimit !== undefined) updates.credit_limit = creditLimit;
  if (status) updates.status = status;

  const { error } = await supabase
    .from('workspace_members')
    .update(updates)
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const caller = await getWorkspaceMember(workspaceId, token);
  if (!caller) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Find target member
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, role, user_token, name, email')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const isSelfLeaving = targetMember.user_token === caller.user_token;

  if (isSelfLeaving) {
    // Owner cannot self-leave
    if (caller.role === 'owner') {
      return NextResponse.json(
        { error: 'Workspace owner cannot leave. Transfer ownership or contact support.' },
        { status: 400 }
      );
    }
  } else {
    // Admin removing member
    if (caller.role !== 'owner' && caller.role !== 'manager') {
      return NextResponse.json({ error: 'Not authorized to remove members' }, { status: 403 });
    }
    // Managers cannot remove owners or other managers
    if (caller.role === 'manager' && (targetMember.role === 'owner' || targetMember.role === 'manager')) {
      return NextResponse.json({ error: 'Managers cannot remove other managers or owners' }, { status: 403 });
    }
    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 });
    }
  }

  const { error: deleteError } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Log activity
  try {
    await logActivity({
      workspaceId,
      userToken: token,
      memberName: caller.name,
      action: isSelfLeaving
        ? 'left the workspace'
        : `removed member ${targetMember.name || targetMember.email}`,
      resourceType: 'member',
      resourceId: targetMember.user_token,
      metadata: { memberName: targetMember.name, role: targetMember.role },
    });
  } catch {
    // silent
  }

  const response = NextResponse.json({ success: true, selfLeft: isSelfLeaving });

  // If member left on their own, clear their workspace cookie so they leave agency mode
  if (isSelfLeaving) {
    response.cookies.set('sparkleads_workspace', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }

  return response;
}
