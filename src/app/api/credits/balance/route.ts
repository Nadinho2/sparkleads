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

  // Agency user — return workspace credit pool balance
  if (workspaceId) {
    const supabase = createSupabaseAdmin();

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credits_remaining, monthly_credits')
      .eq('id', workspaceId)
      .single();

    const { data: member } = await supabase
      .from('workspace_members')
      .select('credit_limit, credits_used')
      .eq('user_token', userToken)
      .eq('workspace_id', workspaceId)
      .single();

    return NextResponse.json({
      balance: workspace?.credits_remaining ?? 0,
      type: 'workspace',
      used: member?.credits_used || 0,
      limit: member?.credit_limit || 0,
      isSubscribed: false,
      subscriptionEnd: null,
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
