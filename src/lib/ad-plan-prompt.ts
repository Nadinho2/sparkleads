export interface AdPlanInput {
  businessName: string;
  businessType: string;
  goal: string;
  budget: number;
  budgetCurrency: string;
  location?: string;
  website?: string;
  extraContext?: string;
}

export function buildAdPlanPrompt(input: AdPlanInput): string {
  const budgetFormatted = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: input.budgetCurrency || 'USD',
    maximumFractionDigits: 0,
  }).format(input.budget);

  const hasWebsite = !!input.website;
  const location = input.location || 'not specified';

  return `
You are a world-class paid advertising strategist with expertise
across every major market globally — including Africa, Asia,
Europe, North America, Latin America, and the Middle East.

You have deep knowledge of local consumer behavior, cultural
nuances, platform usage patterns, and buying psychology for
every country and region.

Your task is to create a hyper-accurate ad strategy for this
specific business by applying your real knowledge of:
1. Who ACTUALLY buys this product/service in this specific market
2. How buyers in this country/region make purchasing decisions
3. Which platforms dominate in this market
4. What messaging and creative approaches work in this culture
5. What the realistic budget can achieve in this market

---

BUSINESS:
Name: ${input.businessName}
Type: ${input.businessType}
Goal: ${input.goal}
Budget: ${budgetFormatted} per month
Location: ${location}
Website: ${input.website || 'None'}
Extra context: ${input.extraContext || 'None'}

---

BEFORE GENERATING, THINK THROUGH THESE:

1. MARKET ANALYSIS
Who are the real buyers of "${input.businessType}" in "${location}"?
- What is the actual gender split based on real buying behavior?
  (e.g. wig sellers serve almost exclusively women regardless of country,
   restaurants serve all genders, barbershops serve primarily men)
- What age group actually has the money and desire to buy this?
- What is the income level required for this purchase?
- How do people in ${input.location || 'this market'} typically discover and
  buy this type of product or service?

2. PLATFORM REALITY CHECK
Which platforms do people in "${location}" actually use most?
- Do not assume Facebook/Instagram are dominant everywhere
- In some markets TikTok dominates (Southeast Asia, parts of Africa)
- In others WhatsApp Business is the primary sales channel
- LinkedIn matters more for B2B in developed markets
- Apply your real knowledge of platform penetration in this market

3. CULTURAL BUYING BEHAVIOR
How does the culture in "${location}" influence buying decisions?
- Is this a relationship-based market where trust must be built first?
- Is it a price-sensitive market where value messaging wins?
- Is social proof (reviews, testimonials) extremely important here?
- Are there local holidays, events, or seasons that drive peak demand?
- What language tone works — formal, conversational, community-oriented?

4. BUDGET REALITY
What does ${budgetFormatted} actually buy in "${location}"?
- CPM, CPC, and CPL vary enormously by country
- $100 in Nigeria buys far more reach than $100 in the UK
- Calibrate ALL estimates to the actual market costs
- Give realistic numbers, not global averages

${!hasWebsite ? `
5. NO WEBSITE CONSTRAINT
This business has no website. Every campaign objective and
conversion action MUST use:
- WhatsApp messages
- Phone calls
- Social media DMs
- Lead generation forms (Facebook/Instagram native)
- Direct store/location visits
Do NOT recommend traffic or conversion campaigns to a website.
` : ''}

---

NOW GENERATE THE COMPLETE AD STRATEGY.

Apply everything you know about this specific business type in
this specific market. Be precise, not generic.

If the location is not specified, make reasonable assumptions
based on the business name and type, and state your assumptions.

Return ONLY valid JSON matching this exact structure.
No markdown. No explanation. Just the JSON.

{
  "market_context": {
    "country_or_region": "What market this strategy is built for",
    "market_maturity": "Emerging | Developing | Mature",
    "primary_discovery_channel": "How people find this type of business here",
    "cultural_note": "Key cultural insight that affects this strategy",
    "budget_power": "What this budget realistically achieves in this market",
    "peak_seasons": ["Season/month 1", "Season/month 2"]
  },

  "executive_summary": "2-3 sentences. Specific strategy for this business in this market.",

  "audience": {
    "primary": {
      "description": "Exactly who to target based on real buyer behavior",
      "gender": "Male only | Female only | Primarily Male | Primarily Female | All genders",
      "gender_reasoning": "Real-world explanation of who actually buys this",
      "age_range": "e.g. 25-45",
      "age_reasoning": "Why this age range has the money and motivation",
      "income_level": "Budget-conscious | Middle income | Upper-middle | High income",
      "income_reasoning": "Why this income level for this product/market",
      "location_targeting": "Specific targeting approach for this market",
      "psychographics": "What motivates these buyers psychologically"
    },
    "secondary": {
      "description": "Secondary audience or null if none",
      "gender": "...",
      "age_range": "...",
      "reasoning": "..."
    },
    "interests": [
      {
        "interest": "Specific targetable interest",
        "relevance": "Why this connects to buyers of this product",
        "platform_availability": "Available on Facebook | Instagram | TikTok | All"
      }
    ],
    "behaviors": [
      {
        "behavior": "Specific targeting behavior",
        "why": "Relevance to this business"
      }
    ],
    "lookalike_strategy": "Who to base lookalike audiences on",
    "exclusions": ["Who to exclude and why"]
  },

  "platforms": [
    {
      "name": "Platform name",
      "recommended": true,
      "priority": 1,
      "market_penetration": "How dominant this platform is in the target market",
      "why": "Specific reason for this business type and market",
      "why_not": null,
      "budget_percentage": 40,
      "objective": "Exact campaign objective to select",
      "ad_formats": ["format1", "format2"],
      "best_format": "Single best format and why",
      "best_days": "Best days of the week",
      "best_hours": "Best hours to run ads",
      "expected_cpr": "Realistic cost per result in the budget currency",
      "local_tip": "Platform-specific tip for this market"
    }
  ],

  "budget": {
    "total": ${input.budget},
    "currency": "${input.budgetCurrency || 'USD'}",
    "daily": ${Math.round(input.budget / 30)},
    "duration_days": 30,
    "split": [],
    "market_context": "How far this budget goes in this specific market",
    "estimated_reach": "Realistic range for this market at this budget",
    "estimated_results": "Realistic range with reasoning",
    "estimated_cpr": "Realistic cost per result with currency",
    "optimization_note": "When and how to adjust after launch"
  },

  "ad_copies": [
    {
      "platform": "Platform name",
      "format": "Ad format",
      "approach": "Hook-based | Problem-Solution | Social Proof | Direct Offer | Educational",
      "cultural_angle": "How this copy is tailored to this specific market/culture",
      "headline": "Punchy headline under 40 chars",
      "primary_text": "Line 1 hook\\n\\nLine 2-3 body\\n\\nLine 4 proof or urgency\\n\\nLine 5 CTA",
      "cta_button": "Most appropriate CTA button",
      "local_language_tip": "Whether to use local language, slang, or phrases"
    }
  ],

  "keywords": {
    "google_primary": ["keyword1", "keyword2"],
    "google_longtail": ["long keyword phrase 1"],
    "negative": ["exclude1"],
    "social_hashtags": ["tag1", "tag2"],
    "local_search_terms": ["How locals actually search for this in their language/slang"]
  },

  "creative_brief": {
    "visual_direction": "What ads should look like for this market",
    "cultural_sensitivity": "Any cultural norms to respect in creatives",
    "color_psychology": "Colors that resonate in this market",
    "content_ideas": [
      {
        "type": "Video | Photo | Carousel",
        "concept": "Specific concept for this market",
        "why_it_works": "Cultural or behavioral reason"
      }
    ],
    "do": ["Market-specific best practice"],
    "dont": ["Market-specific mistake to avoid"]
  },

  "local_strategy": {
    "trust_building": "How to build trust with buyers in this market specifically",
    "payment_methods": "Preferred payment methods in this market to mention in ads",
    "communication_channel": "Preferred contact method in this market",
    "seasonal_opportunities": "Upcoming local events, holidays, or seasons to capitalize on",
    "competitive_advantage": "What messaging gives an edge in this specific market"
  },

  "kpis": [
    {
      "metric": "Metric name",
      "target": "Realistic target for this market",
      "how_to_track": "Where to find this metric"
    }
  ],

  "week_by_week": [
    {
      "week": 1,
      "focus": "Testing phase focus",
      "action": "Specific action",
      "what_to_watch": "Key metric to monitor"
    }
  ],

  "quick_wins": [
    "Immediate action specific to this business and market",
    "Quick win 2",
    "Quick win 3"
  ],

  "warnings": [
    "Market-specific mistake to avoid",
    "Platform policy warning if applicable"
  ]
}
`;
}

