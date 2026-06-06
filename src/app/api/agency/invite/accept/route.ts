import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { setWorkspaceCookie } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, name } = body as { token: string; name: string; password?: string };

  if (!token || !name) {
    return NextResponse.json({ error: 'Token and name required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, email, status')
    .eq('invite_token', token)
    .single();

  if (!member || member.status !== 'invited') {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });
  }

  const userToken = uuidv4();

  // Update member record
  const { error: updateError } = await supabase
    .from('workspace_members')
    .update({
      user_token: userToken,
      name,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('id', member.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true, userToken });
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
