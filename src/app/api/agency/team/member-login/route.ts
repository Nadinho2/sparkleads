import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { setWorkspaceCookie } from '@/lib/agency-auth';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, password, workspaceId } = body as {
    name: string;
    password: string;
    workspaceId?: string;
  };

  if (!name || !password) {
    return NextResponse.json({ error: 'Name and password required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Look up member by name in workspace_members with active status
  // First find all matching names
  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, user_token, name, role, status')
    .eq('name', name)
    .eq('status', 'active');

  if (!members || members.length === 0) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // If workspaceId is provided, filter to that workspace
  const targetMembers = workspaceId
    ? members.filter((m) => m.workspace_id === workspaceId)
    : members;

  if (targetMembers.length === 0) {
    return NextResponse.json({ error: 'Member not found in this workspace' }, { status: 404 });
  }

  // Try each matching member's credentials
  for (const member of targetMembers) {
    const { data: creds } = await supabase
      .from('member_credentials')
      .select('password_hash')
      .eq('user_token', member.user_token)
      .single();

    if (!creds) continue;

    const valid = await bcrypt.compare(password, creds.password_hash);
    if (valid) {
      const response = NextResponse.json({
        success: true,
        workspaceId: member.workspace_id,
        role: member.role,
      });
      response.cookies.set('sparkleads_token', member.user_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
      response.cookies.set(setWorkspaceCookie(member.workspace_id));
      return response;
    }
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
