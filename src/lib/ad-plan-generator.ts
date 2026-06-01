import { safeJsonParse } from './safe-json';
import { buildFocusedPrompt, AD_PLAN_SYSTEM_INSTRUCTION, type AdPlanInput } from './ad-plan-prompt';

export type { AdPlanInput } from './ad-plan-prompt';

export interface AdPlan {
  market_context: {
    country_or_region: string;
    market_maturity: 'Emerging' | 'Developing' | 'Mature';
    primary_discovery_channel: string;
    cultural_note: string;
    budget_power: string;
    peak_seasons: string[];
  };

  executive_summary: string;

  audience: {
    primary: {
      description: string;
      gender: 'Male only' | 'Female only' | 'Primarily Male' | 'Primarily Female' | 'All genders';
      gender_reasoning: string;
      age_range: string;
      age_reasoning: string;
      income_level: 'Budget-conscious' | 'Middle income' | 'Upper-middle' | 'High income';
      income_reasoning: string;
      location_targeting: string;
      psychographics: string;
    };
    secondary: {
      description: string | null;
      gender: string;
      age_range: string;
      reasoning: string;
    } | null;
    interests: { interest: string; relevance: string; platform_availability: string }[];
    behaviors: { behavior: string; why: string }[];
    lookalike_strategy: string;
    exclusions: string[];
  };

  platforms: {
    name: string;
    recommended: boolean;
    priority: number;
    market_penetration: string;
    why: string;
    why_not: string | null;
    budget_percentage: number;
    objective: string;
    ad_formats: string[];
    best_format: string;
    best_days: string;
    best_hours: string;
    expected_cpr: string;
    local_tip: string;
  }[];

  budget: {
    total: number;
    currency: string;
    daily: number;
    duration_days: number;
    split: unknown[];
    market_context: string;
    estimated_reach: string;
    estimated_results: string;
    estimated_cpr: string;
    optimization_note: string;
  };

  ad_copies: {
    platform: string;
    format: string;
    approach: string;
    cultural_angle: string;
    headline: string;
    primary_text: string;
    cta_button: string;
    local_language_tip: string;
  }[];

  keywords: {
    google_primary: string[];
    google_longtail: string[];
    negative: string[];
    social_hashtags: string[];
    local_search_terms: string[];
  };

  creative_brief: {
    visual_direction: string;
    cultural_sensitivity: string;
    color_psychology: string;
    content_ideas: { type: string; concept: string; why_it_works: string }[];
    do: string[];
    dont: string[];
  };

  local_strategy: {
    trust_building: string;
    payment_methods: string;
    communication_channel: string;
    seasonal_opportunities: string;
    competitive_advantage: string;
  };

  kpis: { metric: string; target: string; how_to_track: string }[];
  week_by_week: { week: number; focus: string; action: string; what_to_watch: string }[];
  quick_wins: string[];
  warnings: string[];
}

function geminiTextFromResponse(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = d?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('').trim();
}

function resolveInput(input: AdPlanInput): AdPlanInput & { resolvedLocation: string; businessContext: string } {
  return {
    ...input,
    resolvedLocation: input.resolvedLocation || input.location || 'Nigeria',
    businessContext: input.businessContext || '',
  };
}

async function generateAdPlanWithGemini(input: AdPlanInput): Promise<AdPlan> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const prompt = buildFocusedPrompt(resolveInput(input));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: AD_PLAN_SYSTEM_INSTRUCTION }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errBody}`);
  }

  const data = await response.json();
  const text = geminiTextFromResponse(data);
  if (!text) throw new Error('No content in Gemini response');
  const rawPlan = safeJsonParse<AdPlan>(text);
  return validateAndFix(rawPlan, input);
}

async function generateAdPlanWithClaude(input: AdPlanInput): Promise<AdPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const prompt = buildFocusedPrompt(resolveInput(input));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system:
        'You are a world-class paid advertising strategist. Always respond with valid JSON only. No markdown. No explanation outside JSON.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errBody}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No content in Anthropic response');
  const rawPlan = safeJsonParse<AdPlan>(text);
  return validateAndFix(rawPlan, input);
}

function validateAndFix(plan: AdPlan, input: AdPlanInput): AdPlan {
  const type = input.businessType?.toLowerCase() || '';

  const femaleBusinesses = ['hair', 'wig', 'lace', 'weave', 'nail',
    'makeup', 'beauty', 'lash', 'skincare', 'boutique', 'fashion',
    'lingerie', 'bridal', 'cosmetic'];
  const maleBusinesses = ['barber', 'barbershop', 'mechanic',
    'auto repair', 'tyre', 'engine'];

  const isFemale = femaleBusinesses.some(b => type.includes(b));
  const isMale = maleBusinesses.some(b => type.includes(b));

  if (isFemale && plan.audience?.primary?.gender === 'All genders') {
    plan.audience.primary.gender = 'Primarily Female';
    plan.audience.primary.gender_reasoning =
      `${input.businessType} products are purchased predominantly by women. Male buyers represent less than 10-15% of the customer base.`;
  }

  if (isMale && plan.audience?.primary?.gender === 'All genders') {
    plan.audience.primary.gender = 'Primarily Male';
    plan.audience.primary.gender_reasoning =
      `${input.businessType} services are used predominantly by men.`;
  }

  if (plan.budget?.estimated_reach?.toLowerCase().includes('varies')) {
    const estimatedImpressions = Math.round((input.budget / 275) * 1000);
    const reachMin = Math.round(estimatedImpressions * 0.3);
    const reachMax = Math.round(estimatedImpressions * 0.6);
    plan.budget.estimated_reach =
      `${reachMin.toLocaleString()}–${reachMax.toLocaleString()} people`;
  }

  if (plan.budget?.estimated_results?.toLowerCase().includes('varies')) {
    const leadsMin = Math.round(input.budget / 1800);
    const leadsMax = Math.round(input.budget / 600);
    plan.budget.estimated_results =
      `${leadsMin}–${leadsMax} leads or enquiries`;
  }

  if (plan.budget?.estimated_cpr?.toLowerCase().includes('varies')) {
    plan.budget.estimated_cpr =
      `${input.budgetCurrency} 600–1,800 per lead`;
  }

  if (plan.audience?.interests) {
    plan.audience.interests = plan.audience.interests.filter(
      (i) => i.interest?.toLowerCase() !== input.businessType?.toLowerCase()
    );
  }

  if (!plan.budget?.split || plan.budget.split.length === 0) {
    plan.budget.split = [
      { platform: 'Instagram', amount: Math.round(input.budget * 0.40), percentage: 40 },
      { platform: 'Facebook', amount: Math.round(input.budget * 0.45), percentage: 45 },
      { platform: 'TikTok', amount: Math.round(input.budget * 0.15), percentage: 15 },
    ];
  }

  return plan;
}

function generateFallbackAdPlan(input: AdPlanInput): AdPlan {
  const loc = input.resolvedLocation || input.location || 'Nigeria';
  const currency = input.budgetCurrency || 'NGN';
  const daily = Math.round((input.budget || 0) / 30);
  const hasWebsite = !!input.website;

  return {
    market_context: {
      country_or_region: loc === 'not specified' ? 'Not specified' : loc,
      market_maturity: 'Developing',
      primary_discovery_channel: 'Social media discovery + local search',
      cultural_note: 'Start with trust-building messaging and clear proof of quality.',
      budget_power: `A ${currency}${input.budget} monthly budget requires focused targeting and fast follow-up.`,
      peak_seasons: [],
    },
    executive_summary:
      `Run a focused 30-day campaign for ${input.businessName} targeting real buyers of ${input.businessType} in ${loc}. ` +
      `Prioritize message-based conversions and iterate weekly based on cost per result.`,
    audience: {
      primary: {
        description: `People in ${loc} who actively want ${input.businessType} right now.`,
        gender: 'All genders',
        gender_reasoning:
          'Start broad to let the platform find converting segments, then narrow based on performance data.',
        age_range: '25-45',
        age_reasoning:
          'A working-age segment typically has both purchase intent and ability to pay; refine with data after week 1.',
        income_level: 'Middle income',
        income_reasoning:
          'Middle-income targeting balances reach and conversion likelihood; adjust based on pricing and results.',
        location_targeting: loc,
        psychographics: 'Value quality, convenience, and social proof; respond to clear offers and fast replies.',
      },
      secondary: null,
      interests: [
        {
          interest: input.businessType,
          relevance: 'Direct category relevance to buyers actively considering this service/product.',
          platform_availability: 'All',
        },
      ],
      behaviors: [{ behavior: 'Engaged shoppers', why: 'More likely to click, message, and convert on ads.' }],
      lookalike_strategy: 'Create lookalikes from past customers or people who messaged/called in the last 30-180 days.',
      exclusions: ['Existing customers (if upsell is not the goal)', 'Job seekers'],
    },
    platforms: [
      {
        name: 'Facebook',
        recommended: true,
        priority: 1,
        market_penetration: 'Often strong for local discovery and broad reach',
        why: 'Good local targeting and lead/message objectives for most SMBs.',
        why_not: null,
        budget_percentage: 50,
        objective: hasWebsite ? 'Leads' : 'Messages',
        ad_formats: ['Feed', 'Stories'],
        best_format: 'Feed + Stories for consistent reach with simple creatives.',
        best_days: 'Mon–Sat',
        best_hours: '6pm–10pm',
        expected_cpr: `${currency} (estimate varies by market)`,
        local_tip: 'Keep the first line extremely clear and include a fast contact method.',
      },
      {
        name: 'Instagram',
        recommended: true,
        priority: 2,
        market_penetration: 'Strong for visual categories and DMs',
        why: 'Great for short-form creative and DM-led conversion flows.',
        why_not: null,
        budget_percentage: 50,
        objective: hasWebsite ? 'Leads' : 'Messages',
        ad_formats: ['Reels', 'Stories'],
        best_format: 'Reels for discovery; Stories for quick DM conversions.',
        best_days: 'Tue–Sun',
        best_hours: '7pm–10pm',
        expected_cpr: `${currency} (estimate varies by market)`,
        local_tip: 'Use real photos/videos and add social proof in the caption.',
      },
    ],
    budget: {
      total: input.budget,
      currency,
      daily,
      duration_days: 30,
      split: [],
      market_context: 'Focus on one or two channels and optimize weekly based on cost per result.',
      estimated_reach: 'Varies by country and CPM; measure in-platform after launch.',
      estimated_results: 'Varies by offer and funnel; expect improvement after creative + audience iteration.',
      estimated_cpr: `${currency} varies by market`,
      optimization_note:
        'After 3-5 days, shift budget to the best-performing platform + creative. Refresh creatives weekly if frequency rises.',
    },
    ad_copies: [
      {
        platform: 'Facebook/Instagram',
        format: 'Feed',
        approach: 'Problem-Solution',
        cultural_angle: `Written to match buyer expectations in ${loc}.`,
        headline: `${input.businessType} — ${input.goal}`,
        primary_text:
          `Need ${input.businessType} in ${loc}?\n\n` +
          `Here’s a simple way to get the result you want — with clear pricing and fast response.\n\n` +
          `Trusted by customers who value quality.\n\n` +
          `${hasWebsite ? 'Tap to learn more.' : 'Message us now to get started.'}`,
        cta_button: hasWebsite ? 'Learn More' : 'Send Message',
        local_language_tip: 'Use a conversational tone; add local phrases only if they fit the brand voice.',
      },
    ],
    keywords: {
      google_primary: [`${input.businessType} near me`, `${input.businessType} ${loc}`.trim()].filter(Boolean),
      google_longtail: [`best ${input.businessType} in ${loc}`.trim()].filter(Boolean),
      negative: ['free', 'jobs', 'hiring'],
      social_hashtags: [input.businessType.replace(/\s+/g, ''), 'smallbusiness', 'supportlocal'],
      local_search_terms: [],
    },
    creative_brief: {
      visual_direction: 'Use real customer results, real staff, real location, and clear offer text.',
      cultural_sensitivity: 'Avoid imagery or phrasing that clashes with local norms; keep messaging respectful.',
      color_psychology: 'Use high-contrast colors that match the brand; ensure readability on mobile.',
      content_ideas: [
        {
          type: 'Video',
          concept: 'Short before/after or process demo with clear on-screen text.',
          why_it_works: 'Demonstrations build trust and reduce uncertainty.',
        },
      ],
      do: ['Use real visuals', 'Add proof (reviews/testimonials)', 'Reply fast to messages'],
      dont: ['Overpromise', 'Use stock photos if authenticity matters', 'Run too many objectives at once'],
    },
    local_strategy: {
      trust_building: 'Lead with proof: reviews, testimonials, guarantees, and clear pricing boundaries.',
      payment_methods: 'Mention common local payment options if relevant (transfer, card, cash).',
      communication_channel: hasWebsite ? 'DM/WhatsApp + phone follow-up' : 'WhatsApp/DM as primary conversion path',
      seasonal_opportunities: 'Align promotions with upcoming weekends, holidays, and paydays in the market.',
      competitive_advantage: 'Win on speed-to-response, proof, and a simple offer.',
    },
    kpis: [
      { metric: 'Cost per result', target: `Within ${currency} budget constraints`, how_to_track: 'Ads Manager results' },
      { metric: 'CTR', target: '1%+', how_to_track: 'Ads Manager performance' },
    ],
    week_by_week: [
      { week: 1, focus: 'Testing', action: 'Test 3 creatives and 2 audiences', what_to_watch: 'Cost per result + CTR' },
      { week: 2, focus: 'Optimize', action: 'Shift budget to winners; pause losers', what_to_watch: 'Cost per result trend' },
    ],
    quick_wins: ['Use message objective + fast reply templates', 'Add 1 strong testimonial to every creative', 'Run a limited-time offer'],
    warnings: ['Avoid vague targeting without creative testing', 'Follow platform policies for claims and before/after content'],
  };
}

export async function generateAdPlan(input: AdPlanInput): Promise<AdPlan> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateAdPlanWithGemini(input);
    } catch (err) {
      console.error('Gemini failed, falling back:', err);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateAdPlanWithClaude(input);
    } catch (err) {
      console.error('Anthropic failed, falling back:', err);
    }
  }

  return validateAndFix(generateFallbackAdPlan(input), input);
}

