export interface AdPlanInput {
  businessName: string;
  businessType: string;
  goal: string;
  budget: number;
  budgetCurrency: string;
  location?: string;
  website?: string;
  extraContext?: string;
  resolvedLocation?: string;
  businessContext?: string;
}

export function buildAdPlanPrompt(
  input: AdPlanInput & { resolvedLocation: string; businessContext: string }
): string {
  const budget = input.budget;
  const currency = input.budgetCurrency || 'NGN';
  const location = input.resolvedLocation;
  const businessType = input.businessType;
  const businessName = input.businessName;
  const hasWebsite = !!input.website;
  const goal = input.goal;

  const facebookAmount = Math.round(budget * 0.45);
  const instagramAmount = Math.round(budget * 0.35);

  return `
You are a senior performance marketing strategist.
Generate a complete, specific, accurate ad strategy.

ABSOLUTE RULES — NEVER BREAK THESE:
1. NEVER write "not specified" anywhere in your response
2. NEVER write "varies" for estimated numbers — always give a range
3. NEVER use the business type as an interest category on Facebook
   (e.g. "Hair Vendor" is NOT a Facebook interest — use real interest
   categories like "Hair care", "Beauty", "Fashion", "Online shopping")
4. ALWAYS give specific estimated numbers based on the market
5. ALWAYS generate exactly 3 different ad copy variations
6. ALWAYS determine gender from real buying behavior knowledge
7. ALWAYS use ${businessName} as the business name in ad copies
8. ALWAYS use ${location} as the location — never leave it blank in output

BUSINESS:
Name: ${businessName}
Type: ${businessType}
Goal: ${goal}
Budget: ${currency} ${budget.toLocaleString()} per month
Location: ${location}
Website: ${hasWebsite ? input.website : 'None — use WhatsApp/DM as only conversion'}
Extra context: ${input.extraContext || 'None'}
Business context hints: ${input.businessContext || 'None'}

THINK STEP BY STEP BEFORE WRITING:

STEP 1 — GENDER ANALYSIS
Who ACTUALLY buys ${businessType} in real life?
- Think about the real-world customer base
- Hair products, wigs, extensions → almost exclusively female
- Barbershops → almost exclusively male
- Restaurants → all genders
- Be specific and accurate — do not default to "all genders"
  unless the business genuinely serves all genders equally

STEP 2 — LOCATION INTELLIGENCE
Apply your knowledge of ${location}:
- What platforms do people actually use there?
- What is the CPM/CPC in this market? Give real estimates.
- What cultural nuances affect buying behavior?
- What are peak buying seasons or events in this market?
- What language and tone resonates with buyers there?

STEP 3 — REALISTIC BUDGET CALCULATION
Budget is ${currency} ${budget.toLocaleString()} per month
= ${currency} ${Math.round(budget / 30).toLocaleString()} per day

In ${location}, this budget will achieve approximately:
- Calculate realistic reach range
- Calculate realistic result range
- Calculate realistic cost per result
DO NOT write "varies" — give actual estimated numbers

STEP 4 — REAL FACEBOOK INTEREST CATEGORIES
For ${businessType} in ${location}, the REAL Facebook/Instagram
interest categories to target are things like:
- Actual interest names people follow on Facebook
- Celebrity names, magazine names, competitor brand names
- Lifestyle interests, hobby interests
NOT the business type itself

STEP 5 — AD COPY REQUIREMENTS
Write exactly 3 variations:
- Variation 1: Hook-based (opens with surprising fact or bold statement)
- Variation 2: Problem-Solution (identifies pain, offers solution)
- Variation 3: Social proof / offer (results + urgency)

Each copy must:
- Use ${businessName} by name
- Reference ${location} naturally
- Have a clear line break structure (hook → body → proof → CTA)
- Include WhatsApp or website in the CTA: ${hasWebsite ? input.website : 'WhatsApp'}
- Sound like a real human wrote it, not a template

Return ONLY valid JSON. No markdown. No explanation. Just JSON.

{
  "market_context": {
    "country_or_region": "${location}",
    "market_maturity": "Emerging | Developing | Mature",
    "primary_discovery_channel": "Specific answer for ${location}",
    "cultural_note": "Specific cultural insight relevant to selling ${businessType} in ${location}",
    "budget_power": "Specific description of what ${currency} ${budget} achieves in ${location}",
    "peak_seasons": ["Specific season 1 for ${location}", "Season 2"]
  },

  "executive_summary": "2-3 sentences specific to ${businessName} selling ${businessType} in ${location} with ${currency} ${budget} budget targeting ${goal}.",

  "audience": {
    "primary": {
      "description": "Specific description of real buyers of ${businessType}",
      "gender": "MUST be specific: Male only | Female only | Primarily Female (80%+) | Primarily Male (70%+) | All genders — choose based on real buying behavior",
      "gender_reasoning": "Explain who ACTUALLY buys ${businessType} and why",
      "age_range": "Specific range e.g. 22-40",
      "age_reasoning": "Why this age has the money and motivation for ${businessType}",
      "income_level": "Specific: Budget-conscious | Middle income | Upper-middle | High income",
      "income_reasoning": "Why this income level for ${businessType} in ${location}",
      "location_targeting": "Specific geographic targeting approach in ${location}",
      "psychographics": "What motivates real buyers of ${businessType}"
    },
    "secondary": {
      "description": "Secondary segment or null",
      "gender": "...",
      "age_range": "...",
      "reasoning": "..."
    },
    "interests": [
      {
        "interest": "REAL Facebook interest category name (not the business type)",
        "relevance": "Why real buyers of ${businessType} follow this",
        "platform_availability": "Facebook | Instagram | Both"
      },
      {
        "interest": "Second real interest category",
        "relevance": "...",
        "platform_availability": "..."
      },
      {
        "interest": "Third real interest category",
        "relevance": "...",
        "platform_availability": "..."
      },
      {
        "interest": "Fourth real interest category",
        "relevance": "...",
        "platform_availability": "..."
      },
      {
        "interest": "Fifth real interest category",
        "relevance": "...",
        "platform_availability": "..."
      }
    ],
    "behaviors": [
      {
        "behavior": "Specific Facebook/Instagram targeting behavior",
        "why": "Why relevant to ${businessType} buyers"
      },
      {
        "behavior": "Second behavior",
        "why": "..."
      }
    ],
    "lookalike_strategy": "Specific lookalike approach for ${businessName}",
    "exclusions": ["Specific exclusion with reason"]
  },

  "platforms": [
    {
      "name": "Platform name",
      "recommended": true,
      "priority": 1,
      "market_penetration": "How widely used in ${location} specifically",
      "why": "Specific reason for ${businessType} in ${location}",
      "why_not": null,
      "budget_percentage": 45,
      "objective": "Exact campaign objective name in Ads Manager",
      "ad_formats": ["Best format 1", "Best format 2"],
      "best_format": "Single best format with reason",
      "best_days": "Specific days",
      "best_hours": "Specific hours in ${location} timezone",
      "expected_cpr": "Specific number e.g. NGN 800-1,500 per lead",
      "local_tip": "Platform-specific tip for ${location} market"
    }
  ],

  "budget": {
    "total": ${budget},
    "currency": "${currency}",
    "daily": ${Math.round(budget / 30)},
    "duration_days": 30,
    "split": [
      { "platform": "Facebook", "amount": ${facebookAmount}, "percentage": 45 },
      { "platform": "Instagram", "amount": ${instagramAmount}, "percentage": 35 },
      { "platform": "TikTok", "amount": 0, "percentage": 0 }
    ],
    "market_context": "Specific statement about buying power of ${currency} ${budget} in ${location}",
    "estimated_reach": "SPECIFIC range e.g. 45,000-90,000 people — NOT 'varies'",
    "estimated_results": "SPECIFIC range e.g. 80-200 leads — NOT 'varies'",
    "estimated_cpr": "SPECIFIC number e.g. ${currency} 500-1,250 per result",
    "optimization_note": "When and how to optimize after launch"
  },

  "ad_copies": [
    {
      "platform": "Facebook & Instagram",
      "format": "Feed Post",
      "variation": "1 of 3",
      "approach": "Hook-based",
      "cultural_angle": "How this copy fits ${location} market",
      "headline": "Under 40 chars. Uses ${businessName}.",
      "primary_text": "Line 1: Bold hook about ${businessType}\\n\\nLine 2-3: Specific value proposition for ${businessName}\\n\\nLine 4: Trust signal or proof\\n\\nLine 5: CTA with ${hasWebsite ? input.website : 'WhatsApp number placeholder'}",
      "cta_button": "Send Message | Learn More | Shop Now",
      "local_language_tip": "Specific language tip for ${location}"
    },
    {
      "platform": "Facebook & Instagram",
      "format": "Feed Post",
      "variation": "2 of 3",
      "approach": "Problem-Solution",
      "cultural_angle": "...",
      "headline": "Different headline from variation 1",
      "primary_text": "Different angle from variation 1\\n\\nBody paragraph\\n\\nProof line\\n\\nCTA",
      "cta_button": "...",
      "local_language_tip": "..."
    },
    {
      "platform": "Facebook & Instagram",
      "format": "Story/Reel",
      "variation": "3 of 3",
      "approach": "Social Proof + Offer",
      "cultural_angle": "...",
      "headline": "Different headline from variations 1 and 2",
      "primary_text": "Different angle\\n\\nOffer or proof\\n\\nUrgency\\n\\nCTA",
      "cta_button": "...",
      "local_language_tip": "..."
    }
  ],

  "keywords": {
    "google_primary": [
      "${businessType} in ${location}",
      "${businessType} near me",
      "buy ${businessType} ${location}"
    ],
    "google_longtail": [
      "best ${businessType} in ${location}",
      "affordable ${businessType} ${location}",
      "${businessType} delivery ${location}"
    ],
    "negative": ["free", "jobs", "hiring", "DIY"],
    "social_hashtags": [
      "Specific hashtag 1 for ${location}",
      "Specific hashtag 2",
      "Specific hashtag 3",
      "Specific hashtag 4",
      "Specific hashtag 5"
    ],
    "local_search_terms": ["How locals in ${location} actually search for ${businessType}"]
  },

  "creative_brief": {
    "visual_direction": "Specific visual approach for ${businessType} ads in ${location}",
    "cultural_sensitivity": "Specific cultural norm for ${location} to respect",
    "color_psychology": "Colors that work for ${businessType} in ${location}",
    "content_ideas": [
      {
        "type": "Video",
        "concept": "Specific video concept for ${businessName}",
        "why_it_works": "Why this works for ${location} audience"
      },
      {
        "type": "Photo",
        "concept": "Specific photo concept",
        "why_it_works": "..."
      },
      {
        "type": "Carousel",
        "concept": "Specific carousel concept",
        "why_it_works": "..."
      }
    ],
    "do": [
      "Specific do for ${businessType} in ${location}",
      "Specific do 2",
      "Specific do 3"
    ],
    "dont": [
      "Specific dont for ${location} market",
      "Specific dont 2"
    ]
  },

  "local_strategy": {
    "trust_building": "How to build trust with ${location} buyers specifically",
    "payment_methods": "Common payment methods in ${location} to mention",
    "communication_channel": "Primary contact method preference in ${location}",
    "seasonal_opportunities": "Upcoming events or seasons in ${location} to use",
    "competitive_advantage": "Specific edge in ${location} market for ${businessType}"
  },

  "kpis": [
    {
      "metric": "Cost Per Lead",
      "target": "Specific ${currency} target for ${location} market",
      "how_to_track": "Where to find in Ads Manager"
    },
    {
      "metric": "Click Through Rate",
      "target": "Specific % target",
      "how_to_track": "..."
    },
    {
      "metric": "Cost Per 1,000 Impressions",
      "target": "Specific ${currency} estimate for ${location}",
      "how_to_track": "..."
    }
  ],

  "week_by_week": [
    {
      "week": 1,
      "focus": "Launch and test",
      "action": "Specific action for ${businessName}",
      "what_to_watch": "Key metric"
    },
    {
      "week": 2,
      "focus": "Optimize",
      "action": "Specific optimization action",
      "what_to_watch": "Key metric"
    },
    {
      "week": 3,
      "focus": "Scale winners",
      "action": "What to scale",
      "what_to_watch": "Key metric"
    },
    {
      "week": 4,
      "focus": "Review and plan",
      "action": "End of month review",
      "what_to_watch": "Overall ROAS"
    }
  ],

  "quick_wins": [
    "Specific immediate action for ${businessName} in ${location}",
    "Quick win 2 specific to ${businessType}",
    "Quick win 3"
  ],

  "warnings": [
    "Specific warning for ${businessType} ads in ${location}",
    "Platform policy warning if applicable"
  ]
}
`;
}

