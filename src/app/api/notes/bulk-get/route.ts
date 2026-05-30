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
    return NextResponse.json({ notes: {} });
  }

  const supabase = createSupabaseAdmin();

  const { data: notes } = await supabase
    .from('lead_notes')
    .select('lead_id, content')
    .eq('user_token', userToken)
    .in('lead_id', lead_ids);

  const notesMap: Record<string, string> = {};
  if (notes) {
    for (const note of notes) {
      notesMap[note.lead_id] = note.content;
    }
  }

  return NextResponse.json({ notes: notesMap });
}
