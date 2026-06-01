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
  const month = request.nextUrl.searchParams.get('month');
  const profileId = request.nextUrl.searchParams.get('profile_id');

  let query = supabase
    .from('content_calendar')
    .select('*, profile:content_profiles(business_name, business_type)')
    .eq('user_token', userToken)
    .order('scheduled_date', { ascending: true });

  if (month) {
    const start = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
    query = query.gte('scheduled_date', start).lt('scheduled_date', end);
  }

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data || [] });
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { profile_id, content_id, platform, scheduled_date, scheduled_time, caption, hashtags, image_direction, status } = body;

  if (!profile_id || !platform || !scheduled_date || !caption) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('content_calendar')
    .insert({
      user_token: userToken,
      profile_id,
      content_id: content_id || null,
      platform,
      scheduled_date,
      scheduled_time: scheduled_time || null,
      caption,
      hashtags: hashtags || null,
      image_direction: image_direction || null,
      status: status || 'scheduled',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, event: data });
}

export async function DELETE(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('content_calendar')
    .delete()
    .eq('id', id)
    .eq('user_token', userToken);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
