import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = checkRateLimit(`paystack-init:${ip}`, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 500 }
    );
  }

  let body: { email?: string; amount?: number; referral_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, referral_code } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const amount = 1500; // $15 USD = 1500 cents
  const currency = 'USD';
  const reference = `sparkleads_${uuidv4().slice(0, 12)}_${Date.now()}`;

  // Use the request origin for callback URL (works in both localhost and production)
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

  try {
    const paystackRes = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          amount,
          currency,
          reference,
          callback_url: `${origin}/checkout`,
          metadata: {
            referral_code: referral_code || null,
          },
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    await supabase.from('activations').insert({
      id: uuidv4(),
      token: reference,
      email: email.trim().toLowerCase(),
      used: false,
      affiliate_ref: referral_code || null,
    });

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
