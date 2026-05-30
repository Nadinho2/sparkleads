import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { setTokenCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: activation, error: fetchError } = await supabase
    .from('activations')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchError || !activation) {
    return NextResponse.json({ error: 'Invalid activation token' }, { status: 404 });
  }

  if (activation.used) {
    return NextResponse.json({ error: 'Token already used' }, { status: 400 });
  }

  const userToken = uuidv4();
  const referralCode = userToken.slice(0, 8);

  const { error: updateError } = await supabase
    .from('activations')
    .update({ used: true })
    .eq('token', token);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to activate' }, { status: 500 });
  }

  const { error: affiliateError } = await supabase.from('affiliates').insert({
    id: uuidv4(),
    user_token: userToken,
    referral_code: referralCode,
    total_referrals: 0,
    total_earnings: 0,
  });

  if (affiliateError) {
    console.error('Failed to create affiliate record:', affiliateError);
  }

  const response = NextResponse.json({ success: true });
  const cookie = setTokenCookie(userToken);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    maxAge: cookie.maxAge,
    path: cookie.path,
  });

  return response;
}
