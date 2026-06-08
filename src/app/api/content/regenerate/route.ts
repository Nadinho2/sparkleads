import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { deductCredits } from '@/lib/credits';
import { generateContent } from '@/lib/content-prompt';
import type { ContentProfile } from '@/lib/content-prompt';

export const runtime = 'nodejs';

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

  const { profile_id, platform, content_type, goal, variation_id, approach, tone_override, extra_context } = body;

  if (!profile_id || !platform || !content_type || !goal || !variation_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check & deduct credits
  const deduction = await deductCredits(userToken, 1, `Regenerated variation ${variation_id} (${approach})`);
  if (!deduction.success) {
    return NextResponse.json(
      { error: deduction.error, required: deduction.required, balance: deduction.balance },
      { status: 403 }
    );
  }

  const { data: profile } = await supabase
    .from('content_profiles')
    .select('*')
    .eq('id', profile_id)
    .eq('user_token', userToken)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  try {
    const result = await generateContent(
      profile as ContentProfile,
      [platform],
      content_type,
      goal,
      extra_context,
      tone_override,
      1
    );

    const platformResult = result.platforms[platform];
    if (!platformResult?.variations?.length) {
      return NextResponse.json({ error: 'Failed to generate variation' }, { status: 500 });
    }

    const variation = {
      ...platformResult.variations[0],
      id: variation_id,
      approach: approach || platformResult.variations[0].approach,
    };

    return NextResponse.json({
      success: true,
      variation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
