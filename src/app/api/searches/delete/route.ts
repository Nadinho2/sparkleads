import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { searchId } = body as { searchId: string };

  if (!searchId) {
    return NextResponse.json({ error: 'searchId is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from('searches').delete().eq('id', searchId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete search' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
