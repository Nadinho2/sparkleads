import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

const CREDIT_PACKS: Record<string, { credits: number; amount: number; label: string }> = {
  starter: { credits: 50, amount: 500, label: '50 Credits' },
  growth: { credits: 150, amount: 1000, label: '150 Credits' },
  pro: { credits: 500, amount: 2500, label: '500 Credits' },
  mega: { credits: 1000, amount: 4500, label: '1000 Credits' },
};

export async function POST(request: NextRequest) {
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

  const pack = CREDIT_PACKS[body.pack || ''];
  if (!pack) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  if (process.env.NEXT_PUBLIC_FREE_ACCESS === 'true') {
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
      amount: pack.credits,
      description: `Free top-up: ${pack.label}`,
      balance_after: newBalance,
    });

    return NextResponse.json({ success: true, balance: newBalance, free: true });
  }

  const email = request.nextUrl.searchParams.get('email') || '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required for paid purchases' }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
  }

  const reference = `credits_${uuidv4().slice(0, 12)}_${Date.now()}`;
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

  try {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        amount: pack.amount,
        currency: 'USD',
        reference,
        callback_url: `${origin}/dashboard/credits`,
        metadata: {
          type: 'credit_topup',
          pack: body.pack,
          credits: pack.credits,
          user_token: userToken,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error('Paystack credit topup error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
