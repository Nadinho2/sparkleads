import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/password';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: activation } = await supabase
    .from('activations')
    .select('*')
    .eq('email', email)
    .eq('used', true)
    .limit(1)
    .single();

  if (!activation?.user_token) {
    return NextResponse.json(
      { error: 'Account not found. Please purchase access first.' },
      { status: 404 }
    );
  }

  // Verify password if hash exists
  if (activation.password_hash) {
    const isValid = await verifyPassword(password, activation.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }
  } else {
    // Legacy account without password — hash the provided password for future logins
    const { hashPassword } = await import('@/lib/password');
    const passwordHash = await hashPassword(password);
    await supabase
      .from('activations')
      .update({ password_hash: passwordHash })
      .eq('id', activation.id);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('sparkleads_token', activation.user_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return response;
}
