import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_FREE_ACCESS !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from('activations')
    .select('user_token')
    .eq('email', email)
    .eq('used', true)
    .limit(1)
    .single();

  if (existing?.user_token) {
    const response = NextResponse.json({ success: true, existing: true });
    response.cookies.set('sparkleads_token', existing.user_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return response;
  }

  const userToken = uuidv4();
  const referralCode = userToken.slice(0, 8);

  await supabase.from('activations').insert({
    id: uuidv4(),
    token: userToken,
    email,
    used: true,
    user_token: userToken,
  });

  await supabase.from('affiliates').insert({
    id: uuidv4(),
    user_token: userToken,
    referral_code: referralCode,
    total_referrals: 0,
    total_earnings: 0,
  });

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

  const response = NextResponse.json({ success: true });
  response.cookies.set('sparkleads_token', userToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return response;
}
