import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get('user_token');

  if (!userToken) {
    return NextResponse.json({ error: 'user_token is required' }, { status: 400 });
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
    balance: credits?.balance || 0,
    total_purchased: credits?.total_purchased || 0,
    transactions: transactions || [],
  });
}
