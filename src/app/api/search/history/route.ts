import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '200');
  const supabase = createSupabaseAdmin();

  const { data: searches } = await supabase
    .from('searches')
    .select('id')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!searches || searches.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const searchIds = searches.map((s) => s.id);

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, type, address, phone, email, website, rating, reviews, status')
    .in('search_id', searchIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  return NextResponse.json({ leads: leads || [] });
}
