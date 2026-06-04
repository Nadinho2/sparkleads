import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

function geminiTextFromResponse(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = d?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('').trim();
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    businessName?: string;
    businessType?: string;
    location?: string;
    platforms?: string[];
    goal?: string;
    budget?: number;
    adPlanId?: string;
    targetAudience?: string;
    brandColors?: string[];
    existingAssets?: string;
    specialInstructions?: string;
    leadId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    businessName, businessType, location, platforms, goal,
    budget, adPlanId, targetAudience, brandColors,
    existingAssets, specialInstructions, leadId,
  } = body;

  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
  }
  if (!platforms || platforms.length === 0) {
    return NextResponse.json({ error: 'Select at least one platform' }, { status: 400 });
  }
  if (!goal?.trim()) {
    return NextResponse.json({ error: 'Campaign goal is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check credits (5)
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < 5) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: 5, balance: credits?.balance ?? 0 },
      { status: 403 }
    );
  }

  // Load ad plan if provided
  let adPlanData = '';
  if (adPlanId) {
    const { data: plan } = await supabase
      .from('ad_plans')
      .select('plan_data')
      .eq('id', adPlanId)
      .eq('user_token', userToken)
      .single();
    if (plan?.plan_data) {
      adPlanData = `\nAD PLAN DATA:\n${JSON.stringify(plan.plan_data, null, 2)}`;
    }
  }

  const prompt = `You are a senior creative director at a top advertising agency.
Generate a complete, professional creative brief for this ad campaign.

BUSINESS: ${businessName}
TYPE: ${businessType || 'General business'}
LOCATION: ${location || 'Not specified'}
PLATFORMS: ${platforms.join(', ')}
GOAL: ${goal}
${budget ? `BUDGET: ₦${budget.toLocaleString()}` : ''}
TARGET AUDIENCE: ${targetAudience || 'Derive from business type and location'}
BRAND COLORS: ${brandColors?.join(', ') || 'Not specified'}
EXISTING ASSETS: ${existingAssets || 'None mentioned'}
SPECIAL INSTRUCTIONS: ${specialInstructions || 'None'}
${adPlanData}

Generate a complete brief that a designer or video editor can pick up and execute WITHOUT needing to ask questions.
Be extremely specific — dimensions, durations, colors, shot descriptions, text overlays, everything.

Return ONLY valid JSON:

{
  "brief_title": "Campaign name",
  "campaign_overview": "2-3 sentence summary",
  "target_audience_summary": {
    "who": "Specific description",
    "age": "Range",
    "gender": "Specific",
    "mindset": "What they care about",
    "pain_point": "What problem this ad solves for them"
  },
  "brand_guidelines": {
    "tone": "How the brand should feel",
    "colors": {
      "primary": "Hex or description",
      "secondary": "Hex or description",
      "avoid": "Colors to never use"
    },
    "fonts": "Font style direction",
    "logo_usage": "How to use logo in ads",
    "do": ["Brand do 1", "Brand do 2"],
    "dont": ["Brand dont 1", "Brand dont 2"]
  },
  "deliverables": [
    {
      "id": "D1",
      "platform": "Instagram",
      "format": "Feed Video",
      "dimensions": "1080x1080px",
      "duration": "15-30 seconds",
      "quantity": 2,
      "priority": "High",
      "deadline_days": 3
    }
  ],
  "video_scripts": [
    {
      "deliverable_id": "D1",
      "title": "Script title",
      "hook": "First 3 seconds — what to show/say to stop scroll",
      "scenes": [
        {
          "scene": 1,
          "duration": "0-3s",
          "visual": "Exactly what to film or show",
          "audio": "Voiceover text OR music direction",
          "text_overlay": "Any on-screen text",
          "transition": "Cut | Fade | Slide"
        }
      ],
      "cta_scene": {
        "duration": "Last 3-5s",
        "visual": "CTA visual direction",
        "text": "CTA text",
        "contact": "WhatsApp/website to show"
      }
    }
  ],
  "image_directions": [
    {
      "deliverable_id": "D3",
      "title": "Image concept title",
      "composition": "Exactly what to photograph or design",
      "background": "Background direction",
      "subject": "Main subject direction",
      "text_overlay": {
        "headline": "Headline text",
        "subtext": "Supporting text",
        "cta": "CTA text",
        "placement": "Where on image"
      },
      "lighting": "Lighting direction",
      "mood": "Overall mood of the image",
      "reference_style": "Describe a reference aesthetic"
    }
  ],
  "copy_directions": {
    "headline_options": ["Option 1", "Option 2", "Option 3"],
    "tagline": "Brand tagline if applicable",
    "cta_options": ["CTA 1", "CTA 2"],
    "avoid_words": ["Word 1", "Word 2"],
    "key_messages": ["Must communicate this 1", "Must communicate this 2"]
  },
  "production_notes": {
    "equipment": "Phone is fine | Camera recommended | Specific equipment",
    "location": "Where to film/shoot",
    "props": ["Prop 1", "Prop 2"],
    "wardrobe": "What to wear in the video/photos",
    "time_of_day": "Best time for shooting",
    "what_to_avoid": ["Avoid 1", "Avoid 2"]
  },
  "approval_process": {
    "draft_deadline": "X days from brief",
    "revision_rounds": 2,
    "final_deadline": "X days from brief",
    "approval_contact": "${businessName} team"
  },
  "inspiration": {
    "references": ["Describe reference ad style 1", "Describe reference ad style 2"],
    "aesthetic": "Overall aesthetic direction",
    "feel": "How should viewers feel after seeing this ad"
  }
}`;

  let briefData: Record<string, unknown> = {};

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const requestBody = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    let aiData: unknown = null;
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, (attempt * 2000) + Math.random() * 1000));
      }

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody }
      );

      if (aiResponse.ok) {
        aiData = await aiResponse.json();
        break;
      }

      lastError = `Gemini API error: ${aiResponse.status}`;
      const errBody = await aiResponse.text().catch(() => '');
      console.error(`Gemini attempt ${attempt + 1} failed:`, aiResponse.status, errBody.slice(0, 200));

      if (aiResponse.status !== 429 && aiResponse.status !== 503) break;
    }

    if (!aiData) {
      throw new Error(lastError || 'AI service temporarily unavailable. Please try again.');
    }

    const text = geminiTextFromResponse(aiData);
    if (text) {
      briefData = JSON.parse(text);
    } else {
      throw new Error('AI returned empty response');
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Brief generation failed:', errMsg);
    return NextResponse.json({ error: errMsg.includes('429') ? 'AI service is busy. Please wait a moment and try again.' : errMsg }, { status: 500 });
  }

  // Save to database
  const briefId = uuidv4();
  const { error: insertError } = await supabase
    .from('creative_briefs')
    .insert({
      id: briefId,
      user_token: userToken,
      lead_id: leadId || null,
      ad_plan_id: adPlanId || null,
      business_name: businessName,
      business_type: businessType || '',
      platforms,
      brief_data: briefData,
      status: 'draft',
    });

  if (insertError) {
    console.error('Failed to save brief:', insertError);
  }

  // Deduct credits
  const newBalance = credits.balance - 5;
  await supabase
    .from('user_credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_token', userToken);

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'usage',
    amount: -5,
    description: `Creative brief for ${businessName}`,
    balance_after: newBalance,
  });

  return NextResponse.json({
    success: true,
    briefId,
    brief: briefData,
    creditsUsed: 5,
  });
}
