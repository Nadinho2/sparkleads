import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
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

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < 1) {
    return NextResponse.json({ error: 'Not enough credits. Regenerating costs 1 credit.' }, { status: 402 });
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

    const newBalance = credits.balance - 1;
    await supabase
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_token', userToken);

    await supabase.from('credit_transactions').insert({
      user_token: userToken,
      type: 'usage',
      amount: -1,
      description: `Regenerated variation ${variation_id} (${approach}) for ${profile.business_name}`,
      balance_after: newBalance,
    });

    return NextResponse.json({
      success: true,
      variation,
      new_balance: newBalance,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
