import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';
import { checkRateLimit } from '@/lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = checkRateLimit(`signup:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Try again later.' },
      { status: 429 }
    );
  }
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check if email already has an account
  const { data: existingRows, error: checkError } = await supabase
    .from('activations')
    .select('user_token')
    .eq('email', email)
    .limit(1);

  if (checkError) {
    console.error('[SIGNUP_TRIAL] Error checking existing email:', checkError);
    return NextResponse.json(
      { error: 'Database service unavailable. Please check your connection or project status.' },
      { status: 503 }
    );
  }

  if (existingRows && existingRows.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'This email has already been used for an account or free trial. Please log in to your account.',
        code: 'EMAIL_ALREADY_USED',
      },
      { status: 409 }
    );
  }

  // Create new trial account
  const userToken = uuidv4();
  const passwordHash = await hashPassword(password);

  const { error: insertError } = await supabase.from('activations').insert({
    id: uuidv4(),
    token: userToken,
    email,
    used: true,
    user_token: userToken,
    password_hash: passwordHash,
  });

  if (insertError) {
    console.error('[SIGNUP_TRIAL] Error inserting activation:', insertError);
    return NextResponse.json(
      { error: 'Failed to create trial account. Please try again.' },
      { status: 500 }
    );
  }

  // Give 5 trial credits
  await supabase.from('user_credits').insert({
    user_token: userToken,
    balance: 5,
    total_purchased: 0,
  });

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'bonus',
    amount: 5,
    description: 'Free trial — 5 credits to explore SparkLeads',
    balance_after: 5,
  });

  // Create affiliate record
  await supabase.from('affiliates').insert({
    id: uuidv4(),
    user_token: userToken,
    referral_code: userToken.slice(0, 8),
    total_referrals: 0,
    total_earnings: 0,
  });

  const response = NextResponse.json({
    success: true,
    message: 'Trial account created! You have 5 free credits.',
  });
  response.cookies.set('sparkleads_token', userToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return response;
}
