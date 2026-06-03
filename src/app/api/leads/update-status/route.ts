import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

const VALID_STATUSES = ['new', 'contacted', 'interested', 'closed', 'not_interested'];

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { lead_id, status } = body as { lead_id: string; status: string };

  if (!lead_id || !status) {
    return NextResponse.json(
      { error: 'lead_id and status are required' },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Verify the lead belongs to the authenticated user
  const { data: lead } = await supabase
    .from('leads')
    .select('id, searches!inner(user_token)')
    .eq('id', lead_id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Type-safe access to the joined search record
  const searchRecord = lead.searches as unknown as { user_token: string } | null;
  if (!searchRecord || searchRecord.user_token !== token) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', lead_id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  return NextResponse.json({ success: true, lead_id, status });
}
