import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit } from '@/lib/rate-limit';
import { setWorkspaceCookie } from '@/lib/agency-auth';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = checkRateLimit(`login:${ip}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
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

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Try activations first (normal user accounts)
  const { data: activation } = await supabase
    .from('activations')
    .select('*')
    .eq('email', email)
    .eq('used', true)
    .limit(1)
    .single();

  if (activation?.user_token) {
    // Verify password if hash exists
    if (activation.password_hash) {
      const isValid = await verifyPassword(password, activation.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }
    } else {
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

    // Look up workspace membership — try by user_token first, then by email
    const { data: memberByToken } = await supabase
      .from('workspace_members')
      .select('workspace_id, user_token')
      .eq('user_token', activation.user_token)
      .eq('status', 'active')
      .limit(1);

    let workspaceId = memberByToken?.[0]?.workspace_id;

    // If not found by token, try by email (legacy members with mismatched tokens)
    if (!workspaceId) {
      const { data: memberByEmail } = await supabase
        .from('workspace_members')
        .select('workspace_id, user_token, id')
        .eq('email', email)
        .eq('status', 'active')
        .limit(1);

      if (memberByEmail?.[0]) {
        workspaceId = memberByEmail[0].workspace_id;

        // Fix the token mismatch so future lookups work
        await supabase
          .from('workspace_members')
          .update({ user_token: activation.user_token })
          .eq('id', memberByEmail[0].id);
      }
    }

    if (workspaceId) {
      response.cookies.set(setWorkspaceCookie(workspaceId));
    }

    return response;
  }

  // Fallback: try agency member login (invite-only members)
  const { data: workspaceMembers } = await supabase
    .from('workspace_members')
    .select('user_token, workspace_id, status')
    .eq('email', email)
    .eq('status', 'active')
    .limit(1);

  const workspaceMember = workspaceMembers?.[0];

  if (workspaceMember?.user_token) {
    const { data: creds } = await supabase
      .from('member_credentials')
      .select('password_hash')
      .eq('user_token', workspaceMember.user_token)
      .single();

    if (creds?.password_hash) {
      const isValid = await bcrypt.compare(password, creds.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }

      const response = NextResponse.json({ success: true });
      response.cookies.set('sparkleads_token', workspaceMember.user_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
      response.cookies.set(setWorkspaceCookie(workspaceMember.workspace_id));
      return response;
    }
  }

  return NextResponse.json(
    { error: 'Account not found. Please purchase access first.' },
    { status: 404 }
  );
}
