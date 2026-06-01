import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const CREDIT_PACKS: Record<string, { credits: number }> = {
  starter: { credits: 50 },
  growth: { credits: 150 },
  pro: { credits: 500 },
  mega: { credits: 1000 },
};

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
  }

  let body: { reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { reference } = body;
  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    const metadata = paystackData.data.metadata;
    if (metadata?.type !== 'credit_topup') {
      return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    const userToken = metadata.user_token as string;
    const packKey = metadata.pack as string;
    const credits = metadata.credits as number || CREDIT_PACKS[packKey]?.credits || 0;

    if (!userToken || !credits) {
      return NextResponse.json({ success: false, error: 'Invalid metadata' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { data: existing } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_token', userToken)
      .single();

    const newBalance = (existing?.balance || 0) + credits;
    const newTotalPurchased = (existing?.total_purchased || 0) + credits;

    if (existing) {
      await supabase
        .from('user_credits')
        .update({ balance: newBalance, total_purchased: newTotalPurchased, updated_at: new Date().toISOString() })
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
      amount: credits,
      description: `Purchased ${credits} credits via Paystack`,
      balance_after: newBalance,
    });

    return NextResponse.json({ success: true, balance: newBalance, credits_added: credits });
  } catch (error) {
    console.error('Credit verify error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
