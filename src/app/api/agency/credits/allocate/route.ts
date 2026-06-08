import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

/**
 * POST /api/agency/credits/allocate
 * Owner/manager allocates credits from the workspace pool to a team member.
 * This sets (or increases) the member's credit_limit, which acts as their personal budget.
 */
export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const body = await request.json();
  const { memberId, amount } = body as { memberId: string; amount: number };

  if (!memberId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'memberId and positive amount required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Verify caller is owner or manager
  const { data: caller } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_token', token)
    .eq('status', 'active')
    .single();

  if (!caller || (caller.role !== 'owner' && caller.role !== 'manager')) {
    return NextResponse.json({ error: 'Only owners and managers can allocate credits' }, { status: 403 });
  }

  // Get the target member
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id, name, credit_limit, credits_used, user_token')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Get workspace to check available credits
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('credits_remaining')
    .eq('id', workspaceId)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  if (workspace.credits_remaining < amount) {
    return NextResponse.json({
      error: 'Not enough credits in workspace pool',
      available: workspace.credits_remaining,
    }, { status: 400 });
  }

  // Transfer credits: deduct from workspace pool, add to member's limit
  const newMemberLimit = member.credit_limit + amount;

  const { error: wsErr } = await supabase
    .from('workspaces')
    .update({ credits_remaining: workspace.credits_remaining - amount })
    .eq('id', workspaceId);

  if (wsErr) {
    return NextResponse.json({ error: 'Failed to deduct from workspace pool' }, { status: 500 });
  }

  await supabase
    .from('workspace_members')
    .update({ credit_limit: newMemberLimit })
    .eq('id', memberId);

  // Log activity
  await supabase.from('workspace_activity').insert({
    workspace_id: workspaceId,
    user_token: token,
    member_name: caller.role === 'owner' ? 'Owner' : 'Manager',
    action: 'credit_transferred',
    resource_type: 'credit',
    metadata: {
      amount,
      to_member: member.name,
      to_member_token: member.user_token,
      new_member_limit: newMemberLimit,
      description: `Allocated ${amount} credits to ${member.name}`,
    },
  });

  return NextResponse.json({
    success: true,
    allocated: amount,
    memberNewLimit: newMemberLimit,
    workspaceRemaining: workspace.credits_remaining - amount,
  });
}
