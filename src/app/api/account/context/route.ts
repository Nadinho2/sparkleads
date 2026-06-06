import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getWorkspaceId, getWorkspaceForUser } from '@/lib/agency-auth';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ token: '', accountType: 'individual', workspaceId: null });
  }

  const workspaceId = getWorkspaceId();
  const supabase = createSupabaseAdmin();

  if (!workspaceId) {
    // Individual account
    const { data: credits } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_token', token)
      .single();

    return NextResponse.json({
      token,
      accountType: 'individual',
      workspaceId: null,
      workspace: null,
      member: null,
      role: null,
      creditBalance: credits?.balance ?? 0,
    });
  }

  // Agency account
  const { workspace, member } = await getWorkspaceForUser(token);

  if (!workspace || !member) {
    // Invalid workspace — clear cookie
    const response = NextResponse.json({
      token,
      accountType: 'individual',
      workspaceId: null,
      workspace: null,
      member: null,
      role: null,
      creditBalance: 0,
    });
    response.cookies.set('sparkleads_workspace', '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.json({
    token,
    accountType: 'agency',
    workspaceId: workspace.id,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      status: workspace.status,
      monthly_credits: workspace.monthly_credits,
      credits_remaining: workspace.credits_remaining,
      seats_limit: workspace.seats_limit,
      logo_url: workspace.logo_url,
      brand_color: workspace.brand_color,
    },
    member: {
      id: member.id,
      role: member.role,
      credit_limit: member.credit_limit,
      credits_used: member.credits_used,
      name: member.name,
      email: member.email,
    },
    role: member.role,
    creditBalance: workspace.credits_remaining,
  });
}
