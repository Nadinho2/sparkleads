import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from('agency_clients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data: clients } = await query;
  return NextResponse.json({ clients: clients || [] });
}

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const body = await request.json();
  const supabase = createSupabaseAdmin();

  const { data: client, error } = await supabase
    .from('agency_clients')
    .insert({
      workspace_id: workspaceId,
      name: body.name,
      business_type: body.businessType || null,
      location: body.location || null,
      website: body.website || null,
      phone: body.phone || null,
      email: body.email || null,
      contact_person: body.contactPerson || null,
      status: body.status || 'prospect',
      monthly_retainer: body.monthlyRetainer || 0,
      currency: body.currency || 'NGN',
      notes: body.notes || null,
      assigned_to: body.assignedTo || null,
      lead_id: body.leadId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, client });
}
