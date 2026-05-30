import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { lead_id?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { lead_id, content } = body;
  if (!lead_id || content === undefined) {
    return NextResponse.json({ error: 'lead_id and content are required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: existing } = await supabase
    .from('lead_notes')
    .select('id')
    .eq('user_token', userToken)
    .eq('lead_id', lead_id)
    .single();

  if (existing) {
    const { data: updated } = await supabase
      .from('lead_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    return NextResponse.json({ success: true, note: updated });
  }

  const { data: created } = await supabase
    .from('lead_notes')
    .insert({
      user_token: userToken,
      lead_id,
      content,
    })
    .select()
    .single();

  return NextResponse.json({ success: true, note: created });
}
