import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: activation } = await supabase
    .from('activations')
    .select('id, email')
    .eq('email', email)
    .eq('used', true)
    .limit(1)
    .single();

  if (!activation) {
    // Don't reveal whether the email exists
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been generated.',
    });
  }

  const resetToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await supabase.from('password_resets').insert({
    id: crypto.randomUUID?.() || randomBytes(16).toString('hex'),
    email,
    token: resetToken,
    expires_at: expiresAt,
    used: false,
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || ''}/reset-password?token=${resetToken}`;

  // When email is wired up, send the link via email here
  console.log('============================================');
  console.log('PASSWORD RESET LINK');
  console.log(`To: ${email}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('============================================');

  return NextResponse.json({
    success: true,
    message: 'If an account exists with that email, a reset link has been generated.',
    reset_url: resetUrl, // Remove this once email is wired up
  });
}
