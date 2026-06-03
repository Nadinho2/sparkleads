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

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance, total_purchased')
    .eq('user_token', userToken)
    .single();

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    balance: Number(credits?.balance || 0),
    total_purchased: Number(credits?.total_purchased || 0),
    transactions: transactions || [],
  });
}
