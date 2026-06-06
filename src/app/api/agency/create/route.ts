import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { setWorkspaceCookie } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, brandColor, logoUrl, plan } = body as {
    name: string;
    slug: string;
    brandColor?: string;
    logoUrl?: string;
    plan?: string;
  };

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
  }

  const selectedPlan = plan || 'starter';
  const planCredits = selectedPlan === 'pro' ? 10000 : selectedPlan === 'growth' ? 2000 : 500;
  const planSeats = selectedPlan === 'pro' ? 999 : selectedPlan === 'growth' ? 8 : 3;

  // Get user info for the owner member record
  const { data: activation } = await supabase
    .from('activations')
    .select('email')
    .eq('user_token', token)
    .eq('used', true)
    .limit(1)
    .single();

  const ownerEmail = activation?.email || '';
  const ownerName = name.split(' ')[0] || 'Owner';

  // Create workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name,
      slug,
      owner_token: token,
      plan: selectedPlan,
      monthly_credits: planCredits,
      credits_remaining: planCredits,
      seats_limit: planSeats,
      brand_color: brandColor || '#3B82F6',
      logo_url: logoUrl || null,
    })
    .select()
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }

  // Add owner as member
  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_token: token,
    email: ownerEmail,
    name: ownerName,
    role: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  });

  const response = NextResponse.json({ success: true, workspaceId: workspace.id });
  response.cookies.set(setWorkspaceCookie(workspace.id));
  return response;
}
