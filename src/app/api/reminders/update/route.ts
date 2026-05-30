import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; status?: string; note?: string; due_date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { id, status, note, due_date } = body;
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (note !== undefined) updates.note = note;
  if (due_date) updates.due_date = due_date;

  const { data: updated } = await supabase
    .from('follow_up_reminders')
    .update(updates)
    .eq('id', id)
    .eq('user_token', userToken)
    .select()
    .single();

  return NextResponse.json({ success: true, reminder: updated });
}
