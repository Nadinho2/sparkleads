import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = checkRateLimit(`reset-pw:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { token, password } = body;

  if (!token) {
    return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: resetRecord } = await supabase
    .from('password_resets')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (!resetRecord) {
    return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  // Update the activation record with the new password
  const { data: activation } = await supabase
    .from('activations')
    .select('id')
    .eq('email', resetRecord.email)
    .eq('used', true)
    .limit(1)
    .single();

  if (activation) {
    await supabase
      .from('activations')
      .update({ password_hash: passwordHash })
      .eq('id', activation.id);
  }

  // Mark the reset token as used
  await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('id', resetRecord.id);

  return NextResponse.json({ success: true, message: 'Password updated successfully' });
}
