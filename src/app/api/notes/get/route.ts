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
  const leadId = searchParams.get('lead_id');

  if (!leadId) {
    return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: note } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('user_token', userToken)
    .eq('lead_id', leadId)
    .single();

  return NextResponse.json({ note: note || null });
}
