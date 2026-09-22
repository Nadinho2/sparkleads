import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data: client } = await supabase
    .from('agency_clients')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .single();

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Load campaigns linked to this client
  let campaigns: any[] = [];
  try {
    const { getCampaigns } = await import('@/lib/outreach-store');
    const allCampaigns = await getCampaigns(token);
    campaigns = allCampaigns.filter((c) => c.client_id === params.id);
  } catch (e) {
    // Non-fatal
  }

  // Load proposals matching client name
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, business_name, services, pricing, status, created_at, proposal_data')
    .eq('user_token', token)
    .ilike('business_name', `%${client.name}%`)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    client,
    campaigns,
    proposals: proposals || [],
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const body = await request.json();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('agency_clients')
    .update(body)
    .eq('id', params.id)
    .eq('workspace_id', workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
