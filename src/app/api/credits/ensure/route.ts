import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const workspaceId = getWorkspaceId();
  const supabase = createSupabaseAdmin();

  // Agency user — return workspace credit pool balance
  if (workspaceId) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credits_remaining')
      .eq('id', workspaceId)
      .single();

    return NextResponse.json({
      balance: workspace?.credits_remaining ?? 0,
      type: 'workspace',
    });
  }

  // Individual user — return personal balance
  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_token', userToken)
    .single();

  if (existing) {
    return NextResponse.json({
      balance: existing.balance,
      type: 'individual',
      existed: true,
    });
  }

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

  return NextResponse.json({
    balance: 20,
    type: 'individual',
    existed: false,
  });
}
