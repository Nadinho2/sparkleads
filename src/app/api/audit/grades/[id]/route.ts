import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('website_grades')
    .select('*')
    .eq('id', params.id)
    .eq('user_token', userToken)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
  }

  return NextResponse.json({ grade: data });
}
