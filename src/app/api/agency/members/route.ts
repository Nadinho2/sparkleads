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
