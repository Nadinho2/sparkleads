import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { setWorkspaceCookie } from '@/lib/agency-auth';
import { logActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, name, password } = body as {
    token: string;
    name: string;
    password: string;
  };

  console.log('[INVITE_ACCEPT] Received request:', { token: token?.slice(0, 8) + '...', name });

  if (!token || !name || !password) {
    return NextResponse.json({ error: 'Token, name, and password required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Verify invite — try with invite_expires_at, fall back without it
  let member: Record<string, unknown> | null = null;
  const { data: m1, error: e1 } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, role, status, created_at, invite_expires_at, credit_limit, email')
    .eq('invite_token', token)
    .single();

  if (e1 && e1.message?.includes('invite_expires_at')) {
    console.log('[INVITE_ACCEPT] invite_expires_at column missing, retrying without it');
    const { data: m2 } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, role, status, created_at, credit_limit, email')
      .eq('invite_token', token)
      .single();
    member = m2;
  } else {
    member = m1;
  }

  console.log('[INVITE_ACCEPT] Lookup result:', { found: !!member, status: member?.status });

  if (!member) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (member.status !== 'invited') {
    return NextResponse.json({ error: 'Invite already used or revoked' }, { status: 409 });
  }

  // Check expiry — only if invite_expires_at is set
  const inviteExpires = member.invite_expires_at as string | null;
  if (inviteExpires) {
    const expiryDate = new Date(inviteExpires);
    const now = new Date();
    if (now > expiryDate) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }
  }

  // Reuse existing user_token if they already have an account (activations record)
  // This ensures they can log in from any device using email + password
  let userToken: string;
  const memberEmail = member.email as string | null;

  if (memberEmail) {
    const { data: existingActivation } = await supabase
      .from('activations')
      .select('user_token')
      .eq('email', memberEmail)
      .eq('used', true)
      .maybeSingle();

    if (existingActivation?.user_token) {
      userToken = existingActivation.user_token;
      console.log('[INVITE_ACCEPT] Reusing existing user_token from activation:', userToken.slice(0, 8) + '...');
    } else {
      userToken = uuidv4();
      console.log('[INVITE_ACCEPT] No existing activation, generating new user_token:', userToken.slice(0, 8) + '...');
    }
  } else {
    userToken = uuidv4();
    console.log('[INVITE_ACCEPT] No email on record, generating new user_token:', userToken.slice(0, 8) + '...');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Store credentials (upsert — replace if token already exists)
  await supabase.from('member_credentials').upsert({
    user_token: userToken,
    password_hash: hashedPassword,
    name,
  }, { onConflict: 'user_token' });

  // Update workspace_members record
  const { error: updateError } = await supabase
    .from('workspace_members')
    .update({
      user_token: userToken,
      name,
      status: 'active',
      joined_at: new Date().toISOString(),
      invite_token: null,
    })
    .eq('id', member.id);

  if (updateError) {
    console.error('[INVITE_ACCEPT] Update error:', updateError);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }

  // Create user_credits record
  await supabase.from('user_credits').upsert({
    user_token: userToken,
    balance: 0,
    total_purchased: 0,
  }, { onConflict: 'user_token' });

  // Log activity
  await logActivity({
    workspaceId: member.workspace_id as string,
    userToken,
    memberName: name,
    action: 'joined the workspace',
    resourceType: 'member',
    resourceId: userToken,
    metadata: { role: member.role },
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set('sparkleads_token', userToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  response.cookies.set(setWorkspaceCookie(member.workspace_id as string));
  response.cookies.set('sparkleads_new_member', 'true', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60,
    path: '/',
  });
  return response;
}
