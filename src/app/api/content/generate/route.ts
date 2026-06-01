import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
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

  const { profile_id, platforms, content_type, goal, extra_context, tone_override } = body;

  if (!profile_id || !platforms?.length || !content_type || !goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < 3) {
    return NextResponse.json(
      { error: 'insufficient_credits', balance: credits?.balance ?? 0 },
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
      tone_override
    );

    const newBalance = credits.balance - 3;
    await supabase
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_token', userToken);

    await supabase.from('credit_transactions').insert({
      user_token: userToken,
      type: 'usage',
      amount: -3,
      description: `Content generation for ${profile.business_name}`,
      balance_after: newBalance,
    });

    const { data: savedContent, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        user_token: userToken,
        profile_id,
        platform: platforms.join(','),
        content_type,
        goal,
        variations: content,
        credits_used: 3,
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
