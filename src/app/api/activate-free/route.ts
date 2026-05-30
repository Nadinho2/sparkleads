import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function GET() {
  if (process.env.NEXT_PUBLIC_FREE_ACCESS !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const supabase = createSupabaseAdmin();
  const userToken = uuidv4();
  const referralCode = userToken.slice(0, 8);

  await supabase.from('activations').insert({
    id: uuidv4(),
    token: userToken,
    email: 'personal@sparkleads.dev',
    used: true,
  });

  await supabase.from('affiliates').insert({
    id: uuidv4(),
    user_token: userToken,
    referral_code: referralCode,
    total_referrals: 0,
    total_earnings: 0,
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
