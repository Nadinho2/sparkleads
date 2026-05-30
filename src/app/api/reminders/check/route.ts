import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { lead_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { lead_ids } = body;
  if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ lead_ids_with_reminders: [] });
  }

  const supabase = createSupabaseAdmin();

  const { data: reminders } = await supabase
    .from('follow_up_reminders')
    .select('lead_id')
    .eq('user_token', userToken)
    .eq('status', 'pending')
    .in('lead_id', lead_ids);

  const leadIdsWithReminders = (reminders || []).map((r) => r.lead_id);

  return NextResponse.json({ lead_ids_with_reminders: leadIdsWithReminders });
}
