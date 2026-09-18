import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { user_token?: string; email?: string; new_password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const user_token = body.user_token || (body as any).token;
  const email = body.email;
  const new_password = body.new_password || (body as any).newPassword;

  if (!new_password || new_password.trim().length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  if (!user_token && !email) {
    return NextResponse.json({ error: 'user_token or email is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const hashedPassword = await hashPassword(new_password.trim());

  let query = supabase.from('activations').update({
    password_hash: hashedPassword,
  });

  if (user_token) {
    query = query.eq('user_token', user_token);
  } else if (email) {
    query = query.eq('email', email.trim().toLowerCase());
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Password updated successfully' });
}
