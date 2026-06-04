import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { getJson } from 'serpapi';
import { v4 as uuidv4 } from 'uuid';
import { aiGenerateJSON } from '@/lib/ai-client';

export const runtime = 'nodejs';

const CREDIT_COST = 2;

interface CheckResult {
  score: number;
  label: string;
  detail: string;
  weight: number;
}



export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { businessName?: string; location?: string; leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessName, location, leadId } = body;

  if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < CREDIT_COST) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: CREDIT_COST, balance: credits?.balance ?? 0 },
      { status: 403 }
    );
  }

  // Search SerpAPI for the business
  const query = `${businessName.trim()} ${location?.trim() || ''}`.trim();
  let business: Record<string, unknown> | null = null;
  let serpRawData: Record<string, unknown> | null = null;

  try {
    const serpResult = await getJson({
      engine: 'google_maps',
      q: query,
      type: 'search',
      api_key: process.env.SERPAPI_KEY,
    });

    serpRawData = serpResult;
    const results = serpResult.local_results || [];
    if (results.length > 0) {
      business = results[0] as Record<string, unknown>;
    }
  } catch (err) {
    console.error('SerpAPI error:', err);
  }

  // Build checks
  const checks: Record<string, CheckResult> = {
    claimed: {
      score: business ? 100 : 0,
      label: 'Profile Claimed',
      detail: business ? 'Google Business Profile found' : 'No profile found — major opportunity!',
      weight: 20,
    },
    hasPhotos: {
      score: business?.thumbnail ? 100 : 0,
      label: 'Photos Uploaded',
      detail: business?.thumbnail ? 'Has photos' : 'No photos found',
      weight: 15,
    },
    hasPhone: {
      score: business?.phone ? 100 : 0,
      label: 'Phone Number Listed',
      detail: (business?.phone as string) || 'No phone number listed',
      weight: 15,
    },
    hasWebsite: {
      score: business?.website ? 100 : 0,
      label: 'Website Linked',
      detail: (business?.website as string) || 'No website linked',
      weight: 10,
    },
    hasRating: {
      score: business?.rating
        ? ((business.rating as number) >= 4.0 ? 100 : (business.rating as number) >= 3.0 ? 60 : 30)
        : 0,
      label: 'Customer Reviews',
      detail: business?.rating
        ? `${business.rating}★ (${business.reviews || 0} reviews)`
        : 'No reviews',
      weight: 20,
    },
    hasHours: {
      score: business?.hours ? 100 : 0,
      label: 'Opening Hours Set',
      detail: (business?.hours as string) || 'No hours listed',
      weight: 10,
    },
    hasAddress: {
      score: business?.address ? 100 : 0,
      label: 'Address Listed',
      detail: (business?.address as string) || 'No address listed',
      weight: 10,
    },
  };

  // Calculate overall score
  const overallScore = Math.round(
    Object.values(checks).reduce((acc, check) => {
      return acc + (check.score * check.weight) / 100;
    }, 0)
  );

  // Generate AI recommendations
  let recommendations: { priority: string; title: string; description: string; impact: string }[] = [];

  try {
    const prompt = `Google Business Profile audit for "${businessName}" ${location ? `in ${location}` : ''}:
Overall score: ${overallScore}/100
${business ? `Profile found with ${business.reviews || 0} reviews and ${business.rating || 'no'} rating` : 'No Google Business Profile found'}

Checks: ${JSON.stringify(checks, null, 2)}

Generate 5 specific, actionable recommendations to improve this business's Google presence. Focus on what an agency could offer as services.
Return a JSON array with this exact format:
[{ "priority": "high|medium|low", "title": "Short title", "description": "What to do and why", "impact": "+X points if fixed" }]
Only return the JSON array, no other text.`;

    recommendations = await aiGenerateJSON<typeof recommendations>({
      prompt,
      systemInstruction: 'You are a Google Business Profile optimization expert. Return ONLY valid JSON array.',
      temperature: 0.5,
      maxOutputTokens: 4096,
    });
  } catch (err) {
    console.error('AI recommendations failed:', err);
    recommendations = [
      { priority: 'high', title: 'Claim Google Business Profile', description: 'Create or claim the Google Business Profile listing to control your online presence.', impact: '+20 points' },
      { priority: 'high', title: 'Add photos', description: 'Upload high-quality photos of your business, products, and services. Businesses with photos get 42% more direction requests.', impact: '+15 points' },
      { priority: 'medium', title: 'Collect more reviews', description: 'Ask satisfied customers to leave Google reviews. Aim for 10+ reviews to build trust.', impact: '+15 points' },
      { priority: 'medium', title: 'Add phone number', description: 'List a reachable phone number so customers can contact you directly.', impact: '+15 points' },
      { priority: 'low', title: 'Set business hours', description: 'Add your opening hours so customers know when you are available.', impact: '+10 points' },
    ];
  }

  // Deduct credits
  const newBalance = credits.balance - CREDIT_COST;
  await supabase
    .from('user_credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_token', userToken);

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'usage',
    amount: -CREDIT_COST,
    description: `GBP audit for ${businessName}`,
    balance_after: newBalance,
  });

  // Save to database
  const auditId = uuidv4();
  await supabase.from('gbp_audits').insert({
    id: auditId,
    user_token: userToken,
    lead_id: leadId || null,
    business_name: businessName.trim(),
    location: location?.trim() || null,
    overall_score: overallScore,
    breakdown: checks,
    recommendations,
    serpapi_data: serpRawData,
  });

  return NextResponse.json({
    success: true,
    auditId,
    overallScore,
    checks,
    recommendations,
    business: business
      ? {
          name: business.title || businessName,
          address: business.address || null,
          phone: business.phone || null,
          website: business.website || null,
          rating: business.rating || null,
          reviews: business.reviews || 0,
          hours: business.hours || null,
          thumbnail: business.thumbnail || null,
          type: business.type || null,
        }
      : null,
  });
}
