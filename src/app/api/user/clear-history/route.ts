import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export async function DELETE() {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { count: searchCount } = await supabase
    .from('searches')
    .select('*', { count: 'exact', head: true })
    .eq('user_token', token);

  const { data: searches } = await supabase
    .from('searches')
    .select('id')
    .eq('user_token', token);

  if (searches && searches.length > 0) {
    const searchIds = searches.map((s) => s.id);

    await supabase.from('leads').delete().in('search_id', searchIds);
  }

  const { error } = await supabase
    .from('searches')
    .delete()
    .eq('user_token', token);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    deleted_count: searchCount || 0,
  });
}
