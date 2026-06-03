import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { amount, bank_name, account_number, account_name } = body as {
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
  };

  if (!amount || !bank_name || !account_number || !account_name) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    );
  }

  if (amount < 10) {
    return NextResponse.json(
      { error: 'Minimum payout is ₦13,300' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('total_earnings')
    .eq('user_token', token)
    .single();

  if (!affiliate || Number(affiliate.total_earnings) < amount) {
    return NextResponse.json(
      { error: 'Insufficient earnings' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('payout_requests').insert({
    id: uuidv4(),
    user_token: token,
    amount,
    bank_name,
    account_number,
    account_name,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
