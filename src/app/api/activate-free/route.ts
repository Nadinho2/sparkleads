import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';
import { checkRateLimit } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_FREE_ACCESS !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = checkRateLimit(`activate-free:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string; referral_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const refCode = body.referral_code?.trim() || null;
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from('activations')
    .select('id')
    .eq('email', email)
    .eq('used', true)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'An account with this email already exists. Please log in to your account.',
        code: 'EMAIL_ALREADY_USED',
      },
      { status: 409 }
    );
  }

  const userToken = uuidv4();
  const referralCode = userToken.slice(0, 8);

  const passwordHash = password ? await hashPassword(password) : null;

  const activationRecord: Record<string, unknown> = {
    id: uuidv4(),
    token: userToken,
    email,
    used: true,
    user_token: userToken,
    affiliate_ref: refCode,
  };
  if (passwordHash) activationRecord.password_hash = passwordHash;

  await supabase.from('activations').insert(activationRecord);

  await supabase.from('affiliates').insert({
    id: uuidv4(),
    user_token: userToken,
    referral_code: referralCode,
    total_referrals: 0,
    total_earnings: 0,
  });

  // Increment referring affiliate's total_referrals count
  if (refCode) {
    const { data: referringAffiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('referral_code', refCode)
      .single();

    if (referringAffiliate) {
      await supabase
        .from('affiliates')
        .update({
          total_referrals: referringAffiliate.total_referrals + 1,
        })
        .eq('id', referringAffiliate.id);

      await createNotification(referringAffiliate.user_token, {
        title: '🤝 New Referral Registered!',
        message: `${email} just signed up using your referral link. You will earn ₦1,800/mo recurring commission when they activate a paid plan.`,
        type: 'referral',
        link: '/dashboard/affiliate',
      });
    }
  }

  await createNotification(userToken, {
    title: '⚡ Welcome to SparkLeads!',
    message: 'Your account is ready with 20 welcome tokens. Search businesses in any city and start reaching out today!',
    type: 'subscription',
    link: '/dashboard',
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
