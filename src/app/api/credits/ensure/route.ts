import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_token', userToken)
    .single();

  if (existing) {
    return NextResponse.json({
      balance: existing.balance,
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

  return NextResponse.json({ balance: 20, existed: false });
}
