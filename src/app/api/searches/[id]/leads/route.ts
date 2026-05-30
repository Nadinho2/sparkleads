import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchId = params.id;

  if (!searchId) {
    return NextResponse.json({ error: 'Search ID is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: search, error: searchError } = await supabase
    .from('searches')
    .select('*')
    .eq('id', searchId)
    .single();

  if (searchError || !search) {
    return NextResponse.json({ error: 'Search not found' }, { status: 404 });
  }

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('search_id', searchId)
    .order('created_at', { ascending: true });

  if (leadsError) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  return NextResponse.json({ search, leads: leads || [] });
}
