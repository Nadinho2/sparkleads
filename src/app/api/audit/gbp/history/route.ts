import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('gbp_audits')
    .select('id, business_name, location, overall_score, created_at')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }

  return NextResponse.json({ audits: data ?? [] });
}
