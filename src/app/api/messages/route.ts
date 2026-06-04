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
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');

  const supabase = createSupabaseAdmin();

  let query = supabase
    .from('ai_generated_messages')
    .select('*, leads(name, type, address, phone, email)')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type && type !== 'all') {
    query = query.eq('message_type', type);
  }
  if (status === 'used') query = query.eq('used', true);
  if (status === 'unused') query = query.eq('used', false);
  if (status === 'sent') query = query.eq('sent', true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
