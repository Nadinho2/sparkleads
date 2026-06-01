import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { buildContentPrompt } from '@/lib/content-prompt';

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

  const prompt = buildContentPrompt(
    profile,
    platforms,
    content_type,
    goal,
    extra_context,
    tone_override
  );

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
    let response: Response | null = null;
    let lastError = '';

    for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.8,
                maxOutputTokens: 8192,
              },
            }),
          }
        );

        if (response.ok) break;

        const errBody = await response.text();
        lastError = `${model}: ${response.status}`;

        if (response.status === 429) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
          continue;
        }

        if (response.status === 404) break;
        console.error('Gemini error:', model, response.status, errBody);
        break;
      }
      if (response?.ok) break;
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.', details: lastError },
        { status: 429 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('No content in Gemini response:', JSON.stringify(data));
      return NextResponse.json({ error: 'No content generated' }, { status: 502 });
    }

    const content = JSON.parse(responseText);

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
