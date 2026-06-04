import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { getJson } from 'serpapi';
import { v4 as uuidv4 } from 'uuid';
import { aiGenerateJSON } from '@/lib/ai-client';

export const runtime = 'nodejs';

const CREDIT_COST = 5;



interface ScoredBusiness {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number;
  hasPhotos: boolean;
  scores: {
    rating: number;
    reviews: number;
    hasWebsite: number;
    hasPhone: number;
    hasPhotos: number;
  };
  overallScore: number;
}

function scoreBusiness(biz: Record<string, unknown>): ScoredBusiness {
  const rating = biz.rating as number | null;
  const reviews = (biz.reviews as number) || 0;
  const website = biz.website as string | null;
  const phone = biz.phone as string | null;
  const thumbnail = biz.thumbnail as string | null;

  const scores = {
    rating: rating ? Math.round(rating * 20) : 0,
    reviews: Math.min(100, Math.round(reviews / 2)),
    hasWebsite: website ? 100 : 0,
    hasPhone: phone ? 100 : 0,
    hasPhotos: thumbnail ? 100 : 0,
  };

  const overallScore = Math.round(
    scores.rating * 0.3 +
    scores.reviews * 0.25 +
    scores.hasWebsite * 0.2 +
    scores.hasPhone * 0.15 +
    scores.hasPhotos * 0.1
  );

  return {
    name: (biz.title as string) || 'Unknown',
    address: (biz.address as string) || null,
    phone,
    website,
    rating,
    reviews,
    hasPhotos: !!thumbnail,
    scores,
    overallScore,
  };
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { businessName?: string; businessType?: string; location?: string; leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessName, businessType, location, leadId } = body;

  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
  }
  if (!location?.trim()) {
    return NextResponse.json({ error: 'Location is required to find competitors' }, { status: 400 });
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

  // Search for subject business and competitors in parallel
  const [subjectResult, competitorResult] = await Promise.allSettled([
    getJson({
      engine: 'google_maps',
      q: `${businessName.trim()} ${location.trim()}`,
      type: 'search',
      api_key: process.env.SERPAPI_KEY,
    }),
    getJson({
      engine: 'google_maps',
      q: `${(businessType || businessName).trim()} ${location.trim()}`,
      type: 'search',
      api_key: process.env.SERPAPI_KEY,
    }),
  ]);

  const subjectData = subjectResult.status === 'fulfilled' ? subjectResult.value : null;
  const competitorData = competitorResult.status === 'fulfilled' ? competitorResult.value : null;

  const subject = subjectData?.local_results?.[0] as Record<string, unknown> | undefined;
  const subjectScored = subject ? scoreBusiness(subject) : null;

  // Filter out subject business and take top 5 competitors
  const allResults = (competitorData?.local_results || []) as Record<string, unknown>[];
  const competitors = allResults
    .filter((r) => {
      const title = ((r.title as string) || '').toLowerCase();
      return title !== businessName.trim().toLowerCase();
    })
    .slice(0, 5)
    .map(scoreBusiness);

  // Generate AI analysis
  let analysis: {
    position: string;
    position_reason: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    strategy: string;
    market_rank: number;
  } | null = null;

  try {
    const prompt = `Analyze this competitive landscape for "${businessName}" (${businessType || 'business'}) in ${location}.

Subject business: ${JSON.stringify(subjectScored, null, 2)}
Competitors (top 5): ${JSON.stringify(competitors, null, 2)}

Provide a thorough competitive analysis. Return JSON with this exact format:
{
  "position": "Leading | Average | Behind",
  "position_reason": "Why this position",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "threats": ["threat 1", "threat 2", "threat 3"],
  "strategy": "One paragraph strategic recommendation for this business",
  "market_rank": 1
}
Only return the JSON object, no other text.`;

    analysis = await aiGenerateJSON<typeof analysis>({
      prompt,
      systemInstruction: 'You are a business strategy consultant analyzing competitive landscapes. Return ONLY valid JSON.',
      temperature: 0.5,
      maxOutputTokens: 4096,
    });
  } catch (err) {
    console.error('AI analysis failed:', err);
  }

  // Fallback analysis
  if (!analysis) {
    const rank = subjectScored
      ? 1 + competitors.filter((c) => c.overallScore > subjectScored.overallScore).length
      : competitors.length + 1;

    analysis = {
      position: subjectScored && subjectScored.overallScore >= 70 ? 'Leading' : subjectScored && subjectScored.overallScore >= 50 ? 'Average' : 'Behind',
      position_reason: subjectScored
        ? `${businessName} has an overall score of ${subjectScored.overallScore}/100`
        : 'Business not found on Google Maps',
      strengths: subjectScored?.rating && subjectScored.rating >= 4 ? ['Good customer rating'] : ['Room for improvement'],
      weaknesses: subjectScored && !subjectScored.scores.hasWebsite ? ['No website linked'] : ['Limited online presence'],
      opportunities: ['Optimize Google Business Profile', 'Collect more customer reviews', 'Add professional photos'],
      threats: competitors.slice(0, 2).map((c) => `${c.name} has ${c.reviews} reviews and ${c.rating || 'no'} rating`),
      strategy: `Focus on improving your Google Business Profile by collecting more reviews, adding photos, and ensuring all information is complete. Competitors in ${location} are active — differentiate through better customer engagement.`,
      market_rank: rank,
    };
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
    description: `Competitor analysis for ${businessName}`,
    balance_after: newBalance,
  });

  // Save to database
  const analysisId = uuidv4();
  await supabase.from('competitor_analyses').insert({
    id: analysisId,
    user_token: userToken,
    lead_id: leadId || null,
    business_name: businessName.trim(),
    business_type: businessType?.trim() || null,
    location: location.trim(),
    subject_data: subjectScored,
    competitors,
    analysis,
  });

  return NextResponse.json({
    success: true,
    analysisId,
    subject: subjectScored,
    competitors,
    analysis,
  });
}
