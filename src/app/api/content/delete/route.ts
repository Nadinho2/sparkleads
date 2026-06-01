import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { contentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { contentId } = body;
  if (!contentId) {
    return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('generated_content')
    .delete()
    .eq('id', contentId)
    .eq('user_token', userToken);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
