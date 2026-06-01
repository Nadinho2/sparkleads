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

export const AD_PLAN_SYSTEM_INSTRUCTION = `You are a senior paid advertising strategist.
You ONLY return valid JSON. Never return markdown or explanations.
You NEVER use placeholder text like "varies", "not specified", or template phrases.
You ALWAYS apply real-world knowledge about who buys specific products.
You ALWAYS give specific numbers, never ranges like "varies by market".
For Nigerian market: CPM is typically ₦150-400, CPC ₦50-200, CPL ₦500-2000.
Hair and beauty products are bought almost exclusively by women aged 18-45.
You ALWAYS generate exactly 3 different ad copy variations.
You ALWAYS list exactly 5 real Facebook interest categories, never the business type itself.`;

export function buildFocusedPrompt(
  input: AdPlanInput & { resolvedLocation: string; businessContext: string }
): string {
  const location = input.resolvedLocation;
  const budget = input.budget;
  const currency = input.budgetCurrency || 'NGN';
  const name = input.businessName;
  const type = input.businessType;
  const goal = input.goal;
  const hasWebsite = !!input.website;
  const cta = hasWebsite ? input.website : 'WhatsApp';

  const fb = Math.round(budget * 0.45);
  const ig = Math.round(budget * 0.40);
  const tt = Math.round(budget * 0.15);

  return `
Create a complete ad strategy for:
- Business: ${name}
- Type: ${type}
- Goal: ${goal}
- Budget: ${currency} ${budget.toLocaleString()}/month
- Location: ${location}
- Website: ${input.website || 'None — WhatsApp only'}
- Extra: ${input.extraContext || 'None'}

CRITICAL REQUIREMENTS:
1. Gender: Who REALLY buys ${type}?
   Hair/beauty/wigs/fashion = Female only or Primarily Female.
   Food/pharmacy = All genders.
   Think carefully — do NOT default to "All genders".

2. Interests: List 5 REAL Facebook interest categories for ${type} buyers.
   Examples for hair vendor: "Hair care", "Cosmetics", "Fashion", "Jumia", "Linda Ikeji"
   NEVER use "${type}" as an interest — it is not a Facebook category.

3. Numbers: Give SPECIFIC estimates for ${location}:
   - Nigerian CPM: ₦200-350 average
   - Nigerian CPL: ₦600-1,800 average
   - Estimated reach for ${currency} ${budget}: calculate a real number range
   - NEVER write "varies" anywhere

4. Ad copies: Write exactly 3 variations using "${name}" by name.
   Each must sound like a real Nigerian/local business, not a template.
   Variation 1: Hook-based opener
   Variation 2: Problem/solution
   Variation 3: Offer/urgency
   Each must reference ${name} and ${location} naturally.
   CTA must include: ${cta}

5. Budget split must add up to ${budget}:
   Facebook: ${currency} ${fb} (45%)
   Instagram: ${currency} ${ig} (40%)
   TikTok: ${currency} ${tt} (15%)

Return this exact JSON structure with real specific values:

{
  "market_context": {
    "country_or_region": "${location}",
    "market_maturity": "Developing",
    "primary_discovery_channel": "Real answer for ${location}",
    "cultural_note": "Specific cultural insight for selling ${type} in ${location}",
    "budget_power": "Specific description: ${currency} ${budget} in ${location} gets approximately X reach",
    "peak_seasons": ["Specific season 1", "Specific season 2"]
  },

  "executive_summary": "2-3 sentences about ${name} specifically. Mention the business type, location, and strategy angle. Must NOT be a template.",

  "audience": {
    "primary": {
      "description": "Real description of who buys ${type} in ${location}",
      "gender": "Female only | Male only | Primarily Female | Primarily Male | All genders",
      "gender_reasoning": "Explain who actually buys ${type} in real life",
      "age_range": "Specific range",
      "age_reasoning": "Why this age for ${type} in ${location}",
      "income_level": "Specific level",
      "income_reasoning": "Why this income for ${type}",
      "location_targeting": "How to geo-target in ${location}",
      "psychographics": "What motivates ${type} buyers in ${location}"
    },
    "secondary": null,
    "interests": [
      { "interest": "Real Facebook interest 1 (NOT ${type})", "relevance": "Why", "platform_availability": "Both" },
      { "interest": "Real Facebook interest 2", "relevance": "Why", "platform_availability": "Both" },
      { "interest": "Real Facebook interest 3", "relevance": "Why", "platform_availability": "Facebook" },
      { "interest": "Real Facebook interest 4", "relevance": "Why", "platform_availability": "Instagram" },
      { "interest": "Real Facebook interest 5", "relevance": "Why", "platform_availability": "Both" }
    ],
    "behaviors": [
      { "behavior": "Specific real behavior 1", "why": "Relevance" },
      { "behavior": "Specific real behavior 2", "why": "Relevance" },
      { "behavior": "Specific real behavior 3", "why": "Relevance" }
    ],
    "lookalike_strategy": "Specific lookalike source for ${name}",
    "exclusions": ["Specific exclusion for ${type}"]
  },

  "platforms": [
    {
      "name": "Instagram",
      "recommended": true,
      "priority": 1,
      "market_penetration": "How widely used in ${location}",
      "why": "Specific reason for ${type} in ${location}",
      "why_not": null,
      "budget_percentage": 40,
      "objective": "Exact objective name",
      "ad_formats": ["Format 1", "Format 2"],
      "best_format": "Best format with reason",
      "best_days": "Specific days",
      "best_hours": "Specific hours",
      "expected_cpr": "Specific ${currency} estimate",
      "local_tip": "Specific tip for ${location}"
    },
    {
      "name": "Facebook",
      "recommended": true,
      "priority": 2,
      "market_penetration": "...",
      "why": "...",
      "why_not": null,
      "budget_percentage": 45,
      "objective": "...",
      "ad_formats": ["..."],
      "best_format": "...",
      "best_days": "...",
      "best_hours": "...",
      "expected_cpr": "Specific ${currency} estimate",
      "local_tip": "..."
    },
    {
      "name": "TikTok",
      "recommended": true,
      "priority": 3,
      "market_penetration": "...",
      "why": "...",
      "why_not": null,
      "budget_percentage": 15,
      "objective": "...",
      "ad_formats": ["..."],
      "best_format": "...",
      "best_days": "...",
      "best_hours": "...",
      "expected_cpr": "Specific estimate",
      "local_tip": "..."
    }
  ],

  "budget": {
    "total": ${budget},
    "currency": "${currency}",
    "daily": ${Math.round(budget / 30)},
    "duration_days": 30,
    "split": [
      { "platform": "Instagram", "amount": ${ig}, "percentage": 40 },
      { "platform": "Facebook", "amount": ${fb}, "percentage": 45 },
      { "platform": "TikTok", "amount": ${tt}, "percentage": 15 }
    ],
    "market_context": "Specific statement about ${currency} ${budget} buying power in ${location}",
    "estimated_reach": "SPECIFIC number range e.g. 80,000-150,000 people",
    "estimated_results": "SPECIFIC number range e.g. 120-300 leads",
    "estimated_cpr": "SPECIFIC amount e.g. ${currency} 333-833",
    "optimization_note": "When and how to optimize"
  },

  "ad_copies": [
    {
      "platform": "Instagram & Facebook",
      "format": "Feed Post",
      "variation": "1 of 3",
      "approach": "Hook-based",
      "cultural_angle": "How this fits ${location} audience",
      "headline": "Under 40 chars mentioning ${name}",
      "primary_text": "Hook line specific to ${type}\\n\\nBody about ${name} value\\n\\nProof or urgency line\\n\\nCTA: ${cta}",
      "cta_button": "Send Message",
      "local_language_tip": "Language tip for ${location}"
    },
    {
      "platform": "Instagram & Facebook",
      "format": "Feed Post",
      "variation": "2 of 3",
      "approach": "Problem-Solution",
      "cultural_angle": "...",
      "headline": "Different headline from variation 1",
      "primary_text": "Problem hook\\n\\nSolution from ${name}\\n\\nProof\\n\\nCTA: ${cta}",
      "cta_button": "Send Message",
      "local_language_tip": "..."
    },
    {
      "platform": "TikTok & Instagram Reels",
      "format": "Short Video",
      "variation": "3 of 3",
      "approach": "Offer + Urgency",
      "cultural_angle": "...",
      "headline": "Different headline from variations 1 and 2",
      "primary_text": "Offer hook\\n\\nWhat you get from ${name}\\n\\nUrgency line\\n\\nCTA: ${cta}",
      "cta_button": "Shop Now",
      "local_language_tip": "..."
    }
  ],

  "keywords": {
    "google_primary": ["${type} ${location}", "${type} near me", "buy ${type} ${location}"],
    "google_longtail": ["best ${type} in ${location}", "affordable ${type} ${location}"],
    "negative": ["free", "jobs", "hiring", "DIY tutorial"],
    "social_hashtags": ["Specific hashtag 1", "Specific hashtag 2", "Specific hashtag 3", "Specific hashtag 4", "Specific hashtag 5"],
    "local_search_terms": ["How locals in ${location} search for ${type}"]
  },

  "creative_brief": {
    "visual_direction": "Specific creative direction for ${type} in ${location}",
    "cultural_sensitivity": "Cultural note for ${location}",
    "color_psychology": "Color advice for ${type} brand",
    "content_ideas": [
      { "type": "Video", "concept": "Specific video idea for ${name}", "why_it_works": "Why for ${location}" },
      { "type": "Photo", "concept": "Specific photo idea", "why_it_works": "..." },
      { "type": "Carousel", "concept": "Specific carousel idea", "why_it_works": "..." }
    ],
    "do": ["Specific do for ${type} in ${location}", "Do 2", "Do 3"],
    "dont": ["Specific dont", "Dont 2"]
  },

  "local_strategy": {
    "trust_building": "How to build trust in ${location} for ${type}",
    "payment_methods": "Common payment methods in ${location}",
    "communication_channel": "Preferred contact in ${location}",
    "seasonal_opportunities": "Real upcoming events or seasons in ${location}",
    "competitive_advantage": "Real edge for ${type} in ${location}"
  },

  "kpis": [
    { "metric": "Cost Per Lead", "target": "Specific ${currency} target", "how_to_track": "Ads Manager" },
    { "metric": "Click Through Rate", "target": "Specific % e.g. 1.5-2.5%", "how_to_track": "Ads Manager" },
    { "metric": "Cost Per 1,000 Impressions", "target": "Specific ${currency} estimate", "how_to_track": "Ads Manager" }
  ],

  "week_by_week": [
    { "week": 1, "focus": "Launch", "action": "Specific action for ${name}", "what_to_watch": "CPL" },
    { "week": 2, "focus": "Optimize", "action": "What to cut and what to scale", "what_to_watch": "CTR" },
    { "week": 3, "focus": "Scale", "action": "Scale winning ad sets", "what_to_watch": "ROAS" },
    { "week": 4, "focus": "Review", "action": "Month end analysis", "what_to_watch": "Overall CPL" }
  ],

  "quick_wins": [
    "Specific immediate action for ${name}",
    "Quick win 2 for ${type} in ${location}",
    "Quick win 3"
  ],

  "warnings": [
    "Warning specific to ${type} ads in ${location}",
    "Platform policy warning if applicable"
  ]
}
`;
}
