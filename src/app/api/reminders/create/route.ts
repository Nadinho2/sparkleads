import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { lead_id?: string; due_date?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { lead_id, due_date, note } = body;
  if (!lead_id || !due_date) {
    return NextResponse.json({ error: 'lead_id and due_date are required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from('follow_up_reminders')
    .select('id')
    .eq('user_token', userToken)
    .eq('lead_id', lead_id)
    .eq('status', 'pending')
    .single();

  if (existing) {
    const { data: updated } = await supabase
      .from('follow_up_reminders')
      .update({ due_date, note: note || null, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    return NextResponse.json({ success: true, reminder: updated });
  }

  const { data: created } = await supabase
    .from('follow_up_reminders')
    .insert({
      user_token: userToken,
      lead_id,
      due_date,
      note: note || null,
      status: 'pending',
    })
    .select()
    .single();

  return NextResponse.json({ success: true, reminder: created });
}
