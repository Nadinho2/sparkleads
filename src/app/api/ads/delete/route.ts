import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { planId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { planId } = body;
  if (!planId) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('ad_plans')
    .delete()
    .eq('id', planId)
    .eq('user_token', userToken);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete ad plan' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
