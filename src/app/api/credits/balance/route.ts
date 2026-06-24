import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = getWorkspaceId();

  // Agency user
  if (workspaceId) {
    const supabase = createSupabaseAdmin();

    const { data: member } = await supabase
      .from('workspace_members')
      .select('role, credit_limit, credits_used')
      .eq('user_token', userToken)
      .eq('workspace_id', workspaceId)
      .single();

    // Owners and managers see the workspace pool balance
    if (member?.role === 'owner' || member?.role === 'manager') {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('credits_remaining, monthly_credits')
        .eq('id', workspaceId)
        .single();

      return NextResponse.json({
        balance: workspace?.credits_remaining ?? 0,
        type: 'workspace',
        used: 0,
        limit: 0,
        isSubscribed: false,
        subscriptionEnd: null,
        role: member.role,
      });
    }

    // Members see their own allocated credit balance
    const memberBalance = (member?.credit_limit ?? 0) - (member?.credits_used ?? 0);
    return NextResponse.json({
      balance: Math.max(0, memberBalance),
      type: 'workspace_member',
      used: member?.credits_used ?? 0,
      limit: member?.credit_limit ?? 0,
      isSubscribed: false,
      subscriptionEnd: null,
      role: member?.role ?? 'member',
    });
  }

  // Individual user — return personal balance
  const supabase = createSupabaseAdmin();

  let { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_token', userToken)
    .single();

  if (!credits) {
    await supabase.from('user_credits').insert({
      user_token: userToken,
      balance: 20,
      total_purchased: 0,
    });

    await supabase.from('credit_transactions').insert({
      user_token: userToken,
      type: 'bonus',
      amount: 20,
      description: 'Welcome bonus — 20 free outreach credits',
      balance_after: 20,
    });

    credits = { balance: 20, total_purchased: 0 };
  }

  const { data: sub } = await supabase
    .from('outreach_subscriptions')
    .select('*')
    .eq('user_token', userToken)
    .eq('status', 'active')
    .gte('current_period_end', new Date().toISOString())
    .single();

  return NextResponse.json({
    balance: credits.balance,
    type: 'individual',
    isSubscribed: !!sub,
    subscriptionEnd: sub?.current_period_end ?? null,
    totalPurchased: credits.total_purchased,
  });
}
