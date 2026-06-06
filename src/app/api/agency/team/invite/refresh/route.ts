import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { setWorkspaceCookie } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, userToken } = body as { token: string; userToken: string };

  if (!token || !userToken) {
    return NextResponse.json({ error: 'Token and userToken required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Verify invite token exists
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, status')
    .eq('invite_token', token)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  // Verify userToken belongs to a member in this workspace
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id, status')
    .eq('workspace_id', member.workspace_id)
    .eq('user_token', userToken)
    .eq('status', 'active')
    .single();

  if (!existingMember) {
    return NextResponse.json({ error: 'Member not found or inactive' }, { status: 404 });
  }

  // Re-set cookies
  const response = NextResponse.json({ success: true });
  response.cookies.set('sparkleads_token', userToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  response.cookies.set(setWorkspaceCookie(member.workspace_id));
  return response;
}
