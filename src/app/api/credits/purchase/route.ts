import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_FREE_ACCESS === 'true') {
    return NextResponse.json(
      { error: 'Purchases are not available yet' },
      { status: 403 }
    );
  }

  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { pack?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const packs: Record<string, { credits: number; amount: number }> = {
    starter: { credits: 50, amount: 500 },
    growth: { credits: 150, amount: 1000 },
    pro: { credits: 500, amount: 2500 },
  };

  const pack = packs[body.pack || ''];
  if (!pack) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_token', userToken)
    .single();

  const newBalance = (existing?.balance || 0) + pack.credits;
  const newTotalPurchased = (existing?.total_purchased || 0) + pack.credits;

  if (existing) {
    await supabase
      .from('user_credits')
      .update({ balance: newBalance, total_purchased: newTotalPurchased })
      .eq('user_token', userToken);
  } else {
    await supabase.from('user_credits').insert({
      user_token: userToken,
      balance: newBalance,
      total_purchased: newTotalPurchased,
    });
  }

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'purchase',
    amount: pack.credits,
    description: `Purchased ${pack.credits} credits`,
    balance_after: newBalance,
  });

  return NextResponse.json({ success: true, balance: newBalance });
}
