import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { deductCredits } from '@/lib/credits';
import { generateContent } from '@/lib/content-prompt';

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

  const { profile_id, platforms, content_type, goal, variation_count, extra_context, tone_override } = body;

  if (!profile_id || !platforms?.length || !content_type || !goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const varCount = Math.min(Math.max(Number(variation_count) || 5, 1), 5);
  const creditCost = varCount <= 1 ? 1 : varCount <= 3 ? 2 : 3;

  const supabase = createSupabaseAdmin();

  // Check & deduct credits
  const deduction = await deductCredits(userToken, creditCost, `Content generation (${varCount} variation${varCount > 1 ? 's' : ''})`);
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
    const content = await generateContent(
      profile,
      platforms,
      content_type,
      goal,
      extra_context,
      tone_override,
      varCount
    );

    const { data: savedContent, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        user_token: userToken,
        profile_id,
        platform: platforms.join(','),
        content_type,
        goal,
        variations: content,
        credits_used: creditCost,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to save content:', saveError);
    }

    return NextResponse.json({
      success: true,
      content,
      content_id: savedContent?.id || null,
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}
