import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get('user_token');

  if (!userToken) {
    return NextResponse.json({ error: 'user_token is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: searches } = await supabase
    .from('searches')
    .select('id')
    .eq('user_token', userToken);

  if (!searches || searches.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const searchIds = searches.map((s) => s.id);

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .in('search_id', searchIds)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: leads || [] });
}
