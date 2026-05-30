import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const dateFilter = searchParams.get('date');
  const leadId = searchParams.get('lead_id');

  const supabase = createSupabaseAdmin();

  let query = supabase
    .from('follow_up_reminders')
    .select('*, lead:leads(id, name, phone, email, place_id, website, address, rating, reviews, status)')
    .eq('user_token', userToken)
    .order('due_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  if (dateFilter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    query = query.lte('due_date', today);
  }

  const { data: reminders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminders: reminders || [] });
}
