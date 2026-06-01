import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const platform = request.nextUrl.searchParams.get('platform');
  const contentType = request.nextUrl.searchParams.get('content_type');
  const profileId = request.nextUrl.searchParams.get('profile_id');

  let query = supabase
    .from('generated_content')
    .select('*, profile:content_profiles(business_name, business_type)')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false });

  if (platform) {
    query = query.ilike('platform', `%${platform}%`);
  }
  if (contentType) {
    query = query.eq('content_type', contentType);
  }
  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data || [] });
}
