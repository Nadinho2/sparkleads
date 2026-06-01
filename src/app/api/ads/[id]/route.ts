import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const planId = params.id;
  if (!planId) {
    return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('ad_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_token', userToken)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Ad plan not found' }, { status: 404 });
  }

  return NextResponse.json({ plan: data });
}
