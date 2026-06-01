import { getJson } from 'serpapi';

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

export interface AdPlan {
  summary: string;
  audience: {
    description: string;
    age_min: number;
    age_max: number;
    age_primary: string;
    gender: string;
    gender_reasoning: string;
    location_targeting: string;
    languages: string[];
  };
  interests: {
    category: string;
    specific: string[];
    reasoning: string;
  }[];
  behaviors: string[];
  platforms: {
    name: string;
    priority: number;
    recommended: boolean;
    reason: string;
    budget_percentage: number;
    ad_format: string;
    best_time: string;
  }[];
  budget_breakdown: {
    total: number;
    currency: string;
    daily_budget: number;
    duration_days: number;
    split: {
      platform: string;
      amount: number;
      percentage: number;
    }[];
    cost_per_result_estimate: string;
    estimated_reach: string;
    estimated_results: string;
  };
  ad_copies: {
    platform: string;
    format: string;
    headline: string;
    primary_text: string;
    call_to_action: string;
    hook: string;
  }[];
  keywords: {
    google_search: string[];
    hashtags_social: string[];
    negative_keywords: string[];
  };
  creative_direction: {
    visual_style: string;
    colors: string;
    content_ideas: string[];
    do: string[];
    dont: string[];
  };
  kpis: {
    metric: string;
    target: string;
  }[];
  tips: string[];
}

interface BusinessIntelligence {
  competitorAds: string[];
  relatedKeywords: string[];
  topBusinesses: { name: string; rating: number | null; reviews: number | null }[];
  marketSize: 'small' | 'medium' | 'large';
  searchVolume: number;
}

const BUSINESS_PROFILES: Record<string, {
  interests: { category: string; specific: string[]; reasoning: string }[];
  behaviors: string[];
  adFormats: string[];
  visualStyles: string;
  contentIdeas: string[];
  doList: string[];
  dontList: string[];
}> = {
  'hair salon': {
    interests: [
      { category: 'Beauty & Personal Care', specific: ['Hair styling', 'Hair care products', 'Beauty treatments', 'Natural hair'], reasoning: 'Direct match — these people actively seek hair services' },
      { category: 'Fashion & Style', specific: ['Fashion trends', 'Personal styling', 'Celebrities style'], reasoning: 'Style-conscious individuals are more likely to visit salons regularly' },
      { category: 'Health & Wellness', specific: ['Self-care', 'Spa & relaxation', 'Skincare'], reasoning: 'Wellness-focused consumers invest in appearance' },
    ],
    behaviors: ['Engaged shoppers', 'Frequently visit salons', 'Beauty enthusiasts', 'Online shoppers'],
    adFormats: ['Reels', 'Carousel', 'Stories', 'Single Image'],
    visualStyles: 'Clean, aspirational imagery showing beautiful hair transformations. Before/after shots perform extremely well. Use warm lighting and diverse models.',
    contentIdeas: [
      'Before/after transformation reel showing a dramatic style change',
      'Stylist working on a client with trending music — satisfying process video',
      'Customer testimonial video with their fresh look',
      'Hair care tips carousel with product recommendations',
      'Behind-the-scenes of the salon environment and team',
    ],
    doList: [
      'Show real results on real clients — authenticity converts',
      'Use video content — Reels and TikToks get 3x more reach',
      'Include a clear CTA: "Book now" or "DM to book"',
      'Post during peak hours (6-9 PM local time)',
    ],
    dontList: [
      'Avoid stock photos — use real client work',
      'Don\'t post blurry or poorly lit images',
      'Don\'t use too much text on images',
    ],
  },
  'restaurant': {
    interests: [
      { category: 'Food & Dining', specific: ['Foodie culture', 'Restaurant reviews', 'Food delivery', 'Cooking'], reasoning: 'People interested in food actively look for dining options' },
      { category: 'Lifestyle', specific: ['Date nights', 'Family dining', 'Food photography', 'Local events'], reasoning: 'Lifestyle interests correlate with dining out frequency' },
      { category: 'Travel & Local', specific: ['Local attractions', 'City guides', 'Weekend activities'], reasoning: 'People exploring local activities become regular diners' },
    ],
    behaviors: ['Foodies', 'Frequent restaurant visitors', 'Online food orderers', 'Mobile-first users'],
    adFormats: ['Carousel', 'Reels', 'Stories', 'Single Image'],
    visualStyles: 'Mouth-watering food photography with vibrant colors. Close-up shots of signature dishes. Warm, inviting atmosphere shots.',
    contentIdeas: [
      'Sizzling dish video — close-up of your most popular meal being prepared',
      'Chef\'s special reel with dramatic plating reveal',
      'Customer reaction video tasting your signature dish',
      'Menu highlights carousel with prices',
      'Behind the kitchen — the team preparing for dinner service',
    ],
    doList: [
      'Lead with your best-selling dish — food visuals are everything',
      'Show the dining experience, not just the food',
      'Include location tag and "Order Now" or "Reserve" CTA',
      'Run dinner-time ads (5-8 PM) for maximum conversions',
    ],
    dontList: [
      'Don\'t use dark or unappetizing food photos',
      'Don\'t forget to mention your location prominently',
      'Don\'t post generic content — show what makes YOUR restaurant unique',
    ],
  },
  'gym': {
    interests: [
      { category: 'Fitness & Exercise', specific: ['Gym workouts', 'Weight training', 'Cardio fitness', 'CrossFit'], reasoning: 'Direct interest match — fitness enthusiasts are potential members' },
      { category: 'Health & Wellness', specific: ['Healthy eating', 'Supplements', 'Body transformation', 'Mental wellness'], reasoning: 'Health-conscious individuals are more likely to join a gym' },
      { category: 'Sports', specific: ['Running', 'Bodybuilding', 'Yoga', 'Martial arts'], reasoning: 'Active sports people often seek gym facilities' },
    ],
    behaviors: ['Fitness app users', 'Gym members', 'Health-conscious shoppers', 'New Year resolutioners'],
    adFormats: ['Reels', 'Stories', 'Carousel', 'Single Image'],
    visualStyles: 'High-energy imagery with dramatic lighting. Show real members working out, not just equipment. Motivational quotes overlay on workout footage.',
    contentIdeas: [
      'Transformation reel — a member\'s 3-month progress',
      'Facility tour video showing equipment and atmosphere',
      'Quick workout demo that viewers can try at home (builds trust)',
      'Trainer introduction reel — personal touch',
      'Promo offer video with urgency countdown',
    ],
    doList: [
      'Show real members and real transformations',
      'Offer a free trial or day pass — low commitment CTA',
      'Run January and summer campaigns for peak sign-ups',
      'Target people within a 5-10km radius of your gym',
    ],
    dontList: [
      'Don\'t use overly intimidating imagery for beginners',
      'Don\'t hide pricing — be transparent to build trust',
      'Don\'t ignore WhatsApp — many inquiries come via chat',
    ],
  },
};

const DEFAULT_PROFILE = {
  interests: [
    { category: 'Local Services', specific: ['Local business', 'Nearby services', 'Community'], reasoning: 'Local targeting captures people searching for nearby services' },
    { category: 'Shopping & Deals', specific: ['Online shopping', 'Deals & offers', 'Brand discovery'], reasoning: 'Shoppers are always looking for new businesses to try' },
    { category: 'Lifestyle', specific: ['Lifestyle improvement', 'Personal services', 'Quality of life'], reasoning: 'Lifestyle-driven audiences are open to new service providers' },
  ],
  behaviors: ['Online shoppers', 'Small business owners', 'Local service seekers', 'Mobile-first users'],
  adFormats: ['Single Image', 'Carousel', 'Stories', 'Reels'],
  visualStyles: 'Professional, clean imagery that showcases your business in the best light. Use real photos of your team, location, and work. Authentic visuals build trust.',
  contentIdeas: [
    'Showcase video of your business in action',
    'Customer testimonial or review highlight',
    'Before/after or process demonstration',
    'Team introduction video',
    'Special offer announcement with urgency',
  ],
  doList: [
    'Use real photos and videos from your business',
    'Include a clear call-to-action on every ad',
    'Start with a small budget and test different creatives',
    'Respond to all inquiries within 1 hour for best conversion',
  ],
  dontList: [
    'Don\'t use low-quality or blurry images',
    'Don\'t overload ads with too much text',
    'Don\'t forget to set up WhatsApp as a contact option',
  ],
};

const GOAL_CONFIGS: Record<string, {
  cta: string;
  focus: string;
  platformSplit: { name: string; percentage: number; priority: number; recommended: boolean; reason: string; adFormat: string; bestTime: string }[];
  kpis: { metric: string; target: string }[];
}> = {
  'Get More Customers': {
    cta: 'Book Now',
    focus: 'lead generation and customer acquisition',
    platformSplit: [
      { name: 'Facebook', percentage: 35, priority: 1, recommended: true, reason: 'Largest audience with powerful lead form ads that capture inquiries directly', adFormat: 'Lead Form Ad | Carousel', bestTime: '6 PM - 9 PM weekdays' },
      { name: 'Instagram', percentage: 30, priority: 2, recommended: true, reason: 'Visual platform perfect for showcasing your business with Reels and Stories', adFormat: 'Reels | Stories', bestTime: '7 PM - 10 PM' },
      { name: 'Google', percentage: 25, priority: 3, recommended: true, reason: 'Capture high-intent searchers actively looking for your service', adFormat: 'Search Ad', bestTime: 'Business hours (9 AM - 5 PM)' },
      { name: 'TikTok', percentage: 10, priority: 4, recommended: false, reason: 'Good for brand awareness but lower conversion for service businesses', adFormat: 'Short Video', bestTime: '8 PM - 11 PM' },
    ],
    kpis: [
      { metric: 'Cost Per Lead', target: 'Best possible within budget' },
      { metric: 'Click Through Rate', target: '2% or higher' },
      { metric: 'Return on Ad Spend', target: '3x minimum' },
    ],
  },
  'Drive Website Traffic': {
    cta: 'Learn More',
    focus: 'driving qualified traffic to your website',
    platformSplit: [
      { name: 'Google', percentage: 40, priority: 1, recommended: true, reason: 'Search ads capture high-intent users actively looking for your service', adFormat: 'Search Ad | Display', bestTime: 'Business hours' },
      { name: 'Facebook', percentage: 25, priority: 2, recommended: true, reason: 'Interest-based targeting drives awareness and clicks from relevant audiences', adFormat: 'Carousel | Single Image', bestTime: '6 PM - 9 PM' },
      { name: 'Instagram', percentage: 25, priority: 3, recommended: true, reason: 'Visual content drives engagement and click-through to website', adFormat: 'Stories | Reels', bestTime: '7 PM - 10 PM' },
      { name: 'TikTok', percentage: 10, priority: 4, recommended: false, reason: 'Lower direct traffic quality but good for top-of-funnel awareness', adFormat: 'Short Video', bestTime: '8 PM - 11 PM' },
    ],
    kpis: [
      { metric: 'Cost Per Click', target: 'Lowest possible in your market' },
      { metric: 'Click Through Rate', target: '3% or higher' },
      { metric: 'Bounce Rate', target: 'Below 50%' },
    ],
  },
  'Promote an Offer': {
    cta: 'Shop Now',
    focus: 'promoting a specific offer, deal, or promotion',
    platformSplit: [
      { name: 'Facebook', percentage: 35, priority: 1, recommended: true, reason: 'Best reach for promotions — share offers that get saved and shared', adFormat: 'Carousel | Single Image', bestTime: '12 PM - 2 PM and 6 PM - 9 PM' },
      { name: 'Instagram', percentage: 30, priority: 2, recommended: true, reason: 'Stories and Reels create urgency for limited-time offers', adFormat: 'Stories | Reels', bestTime: '7 PM - 10 PM' },
      { name: 'Google', percentage: 25, priority: 3, recommended: true, reason: 'Search ads capture people already looking for deals in your category', adFormat: 'Search Ad', bestTime: 'Business hours' },
      { name: 'TikTok', percentage: 10, priority: 4, recommended: false, reason: 'Can work for viral offers but less predictable ROI', adFormat: 'Short Video', bestTime: '8 PM - 11 PM' },
    ],
    kpis: [
      { metric: 'Conversion Rate', target: '5% or higher' },
      { metric: 'Cost Per Acquisition', target: 'Best possible' },
      { metric: 'Return on Ad Spend', target: '4x minimum for promotions' },
    ],
  },
  'Build Brand Awareness': {
    cta: 'Learn More',
    focus: 'maximizing reach and brand recognition',
    platformSplit: [
      { name: 'Instagram', percentage: 35, priority: 1, recommended: true, reason: 'Visual brand building is Instagram\'s strength — Reels go viral', adFormat: 'Reels | Stories', bestTime: '7 PM - 10 PM' },
      { name: 'Facebook', percentage: 30, priority: 2, recommended: true, reason: 'Broadest reach for brand awareness campaigns in your market', adFormat: 'Video | Carousel', bestTime: '6 PM - 9 PM' },
      { name: 'TikTok', percentage: 20, priority: 3, recommended: true, reason: 'Organic-feeling content can go viral and build massive awareness', adFormat: 'Short Video', bestTime: '8 PM - 11 PM' },
      { name: 'Google', percentage: 15, priority: 4, recommended: true, reason: 'Display ads reinforce brand awareness across the web', adFormat: 'Display Ad', bestTime: 'All day' },
    ],
    kpis: [
      { metric: 'Reach', target: 'Maximum impressions within budget' },
      { metric: 'Engagement Rate', target: '3% or higher' },
      { metric: 'Brand Recall Lift', target: '10% improvement' },
    ],
  },
  'Get Phone Calls': {
    cta: 'Call Now',
    focus: 'generating phone call inquiries',
    platformSplit: [
      { name: 'Google', percentage: 45, priority: 1, recommended: true, reason: 'Call-only ads and call extensions drive direct phone leads from search', adFormat: 'Call-Only Ad | Search Ad', bestTime: 'Business hours (8 AM - 6 PM)' },
      { name: 'Facebook', percentage: 30, priority: 2, recommended: true, reason: 'Click-to-call ads on mobile generate instant phone inquiries', adFormat: 'Click-to-Call | Single Image', bestTime: '9 AM - 7 PM' },
      { name: 'Instagram', percentage: 15, priority: 3, recommended: true, reason: 'Stories with call sticker or swipe-up for direct calling', adFormat: 'Stories', bestTime: '7 PM - 10 PM' },
      { name: 'TikTok', percentage: 10, priority: 4, recommended: false, reason: 'No native call feature — lower conversion for phone leads', adFormat: 'Short Video', bestTime: '8 PM - 11 PM' },
    ],
    kpis: [
      { metric: 'Cost Per Call', target: 'Best possible within budget' },
      { metric: 'Call Duration', target: '60+ seconds average' },
      { metric: 'Call Conversion Rate', target: '30% of calls become customers' },
    ],
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  KES: 'KSh',
  GHS: 'GH₵',
};

async function fetchBusinessIntelligence(input: AdPlanInput): Promise<BusinessIntelligence> {
  const location = input.location || '';
  const query = `${input.businessType} ${location}`.trim();

  const results = await Promise.allSettled([
    getJson({
      engine: 'google',
      q: `${input.businessType} marketing strategy ads`,
      num: 10,
      api_key: process.env.SERPAPI_KEY,
    }),
    getJson({
      engine: 'google',
      q: `${query} keywords advertising`,
      num: 10,
      api_key: process.env.SERPAPI_KEY,
    }),
    getJson({
      engine: 'google_maps',
      q: query,
      type: 'search',
      start: 0,
      api_key: process.env.SERPAPI_KEY,
    }),
  ]);

  const competitorAds: string[] = [];
  const relatedKeywords: string[] = [];
  const topBusinesses: { name: string; rating: number | null; reviews: number | null }[] = [];

  if (results[0].status === 'fulfilled') {
    const data = results[0].value;
    const organic = data.organic_results || [];
    for (const result of organic.slice(0, 5)) {
      if (result.title) competitorAds.push(result.title as string);
    }
    const related = data.related_searches || [];
    for (const r of related.slice(0, 5)) {
      if (r.query) relatedKeywords.push(r.query as string);
    }
  }

  if (results[1].status === 'fulfilled') {
    const data = results[1].value;
    const organic = data.organic_results || [];
    for (const result of organic.slice(0, 5)) {
      if (result.title && !relatedKeywords.includes(result.title as string)) {
        relatedKeywords.push(result.title as string);
      }
    }
    const related = data.related_searches || [];
    for (const r of related.slice(0, 5)) {
      if (r.query && !relatedKeywords.includes(r.query as string)) {
        relatedKeywords.push(r.query as string);
      }
    }
  }

  if (results[2].status === 'fulfilled') {
    const data = results[2].value;
    const local = data.local_results || [];
    for (const biz of local.slice(0, 10)) {
      topBusinesses.push({
        name: (biz.title as string) || 'Unknown',
        rating: biz.rating ? parseFloat(biz.rating as string) : null,
        reviews: (biz.reviews as number) || null,
      });
    }
  }

  const searchVolume = competitorAds.length + relatedKeywords.length + topBusinesses.length;
  const marketSize: BusinessIntelligence['marketSize'] =
    topBusinesses.length >= 8 ? 'large' : topBusinesses.length >= 4 ? 'medium' : 'small';

  return { competitorAds, relatedKeywords, topBusinesses, marketSize, searchVolume };
}

function generateKeywords(input: AdPlanInput, intel: BusinessIntelligence): AdPlan['keywords'] {
  const bt = input.businessType.toLowerCase();
  const loc = input.location || '';

  const googleSearch = [
    `${input.businessType} near me`,
    `best ${input.businessType} ${loc}`.trim(),
    `affordable ${input.businessType} ${loc}`.trim(),
    `${input.businessType} contact number`,
    `${input.businessType} prices ${loc}`.trim(),
    ...intel.relatedKeywords.slice(0, 5),
  ].filter(Boolean);

  const hashtagsSocial = [
    `#${bt.replace(/\s+/g, '')}`,
    `#${bt.replace(/\s+/g, '')}${loc.split(',')[0]?.replace(/\s+/g, '') || ''}`,
    '#supportlocal',
    '#smallbusiness',
    '#localbusiness',
    '#qualityservice',
    '#customerfirst',
    '#deals',
    '#specialoffer',
    `#${input.goal.toLowerCase().replace(/\s+/g, '')}`,
  ];

  const negativeKeywords = [
    'free',
    'cheap',
    'jobs',
    'hiring',
    'salary',
    'career',
    'internship',
    'DIY',
    'homemade',
  ];

  return {
    google_search: Array.from(new Set(googleSearch)).slice(0, 12),
    hashtags_social: Array.from(new Set(hashtagsSocial)).slice(0, 12),
    negative_keywords: negativeKeywords,
  };
}

function generateAdCopies(input: AdPlanInput, goalConfig: typeof GOAL_CONFIGS[string], intel: BusinessIntelligence): AdPlan['ad_copies'] {
  const location = input.location ? ` in ${input.location}` : '';
  const name = input.businessName;
  const bt = input.businessType;
  const type = bt.toLowerCase();
  const cta = goalConfig.cta;
  const hasWebsite = !!input.website;
  const ctx = input.extraContext || '';

  const topCompetitor = intel.topBusinesses.length > 0 ? intel.topBusinesses[0].name : null;
  const avgRating = intel.topBusinesses.filter(b => b.rating).length > 0
    ? (intel.topBusinesses.filter(b => b.rating).reduce((s, b) => s + (b.rating || 0), 0) / intel.topBusinesses.filter(b => b.rating).length).toFixed(1)
    : null;
  const competitorCount = intel.topBusinesses.length;
  const relatedTerms = intel.relatedKeywords.slice(0, 3);

  const contactMethod = hasWebsite
    ? 'Visit our website to see our work and ' + cta.toLowerCase() + ' today.'
    : 'Message us on WhatsApp to ' + cta.toLowerCase() + '.';

  const hooks: Record<string, string[]> = {
    salon: [
      `Your hair deserves a stylist who actually listens.`,
      `Tired of leaving the salon disappointed? We get it.`,
      `The ${bt.toLowerCase()} ${location || 'experience'} everyone keeps talking about.`,
    ],
    restaurant: [
      `Life's too short for boring meals.`,
      `That craving? We've got exactly what you need.`,
      `The spot ${location || 'your city'} has been waiting for.`,
    ],
    gym: [
      `No judgment. No shortcuts. Just results.`,
      `Your transformation starts with showing up. We handle the rest.`,
      `The gym where beginners feel welcome and regulars feel challenged.`,
    ],
    default: [
      `Stop settling for less when it comes to ${type}${location}.`,
      `Looking for a ${type}${location} that actually delivers? You found us.`,
      `${name} — where quality meets reliability.`,
    ],
  };

  const hookPool = hooks[bt.toLowerCase()] || hooks['default'];

  const socialProofLine = avgRating && parseFloat(avgRating) >= 4
    ? `Rated ${avgRating}/5 by real customers.`
    : competitorCount > 5
    ? `Trusted by hundreds of customers in a market with ${competitorCount}+ competitors.`
    : `Trusted by customers${location} who know quality when they see it.`;

  const competitiveLine = topCompetitor
    ? `Unlike ${topCompetitor} and others, we ${ctx || 'focus on personalized service and real results'}.`
    : ctx
    ? `${ctx}.`
    : `We focus on what matters: quality, reliability, and your satisfaction.`;

  return [
    {
      platform: 'Facebook/Instagram',
      format: 'Feed Ad',
      headline: `${name} — ${cta} | ${bt}${location}`,
      primary_text: `${hookPool[0]}\n\n${socialProofLine} ${competitiveLine}\n\n${contactMethod} Limited slots available — don't miss out!`,
      call_to_action: cta,
      hook: hookPool[0],
    },
    {
      platform: 'Facebook/Instagram',
      format: 'Story Ad',
      headline: `${name} — ${cta}`,
      primary_text: `${hookPool[1] || hookPool[0]}\n\n${socialProofLine} ${relatedTerms.length > 0 ? `People search for "${relatedTerms[0]}" — that's exactly what we deliver.` : `Quality you can trust.`}\n\n${cta} now.`,
      call_to_action: cta,
      hook: hookPool[1] || hookPool[0],
    },
    {
      platform: 'Google Search',
      format: 'Search Ad',
      headline: `${name} | Best ${bt}${location} — ${cta}`,
      primary_text: `${socialProofLine} Professional ${type} services${location}. ${competitiveLine} ${hasWebsite ? 'Visit our website for pricing and availability.' : 'Call or WhatsApp us now.'} ${cta} today.`,
      call_to_action: cta,
      hook: '',
    },
  ];
}

function generateCreativeDirection(input: AdPlanInput, profile: typeof DEFAULT_PROFILE): AdPlan['creative_direction'] {
  return {
    visual_style: profile.visualStyles,
    colors: 'Use your brand colors consistently. If you don\'t have brand colors, use bold, high-contrast palettes that stand out in feeds. For African markets, warm and vibrant colors (gold, red, green) tend to perform well.',
    content_ideas: profile.contentIdeas,
    do: profile.doList,
    dont: profile.dontList,
  };
}

function generateTips(input: AdPlanInput, intel: BusinessIntelligence): string[] {
  const tips = [
    `Start with a small test budget (10-20% of your total) for the first 3-5 days. Use the data to optimize before scaling.`,
    `Set up a WhatsApp Business account — it's the #1 conversion channel for businesses in African markets.`,
    `Respond to every inquiry within 30 minutes. Speed-to-lead is the #1 factor in converting ad clicks to customers.`,
  ];

  if (intel.topBusinesses.length > 0) {
    const avgRating = intel.topBusinesses
      .filter((b) => b.rating)
      .reduce((sum, b) => sum + (b.rating || 0), 0) / intel.topBusinesses.filter((b) => b.rating).length;

    if (avgRating > 0) {
      tips.push(
        `Your top competitors have an average rating of ${avgRating.toFixed(1)}. Make sure your Google Business Profile is optimized with great reviews to stand out.`
      );
    }
  }

  if (!input.website) {
    tips.push(
      `You don't have a website listed. Use WhatsApp or a phone number as your primary conversion action. Consider creating a simple landing page to capture more leads.`
    );
  }

  tips.push(
    `Run A/B tests on your ad creatives. Test different images, headlines, and CTAs to find what resonates best with your audience.`,
    `Retarget people who engaged with your ads but didn't convert. Retargeting campaigns typically have 2-3x better conversion rates.`,
    `Monitor your ads daily for the first week. Pause underperforming ads and reallocate budget to winners.`
  );

  return tips.slice(0, 7);
}

function estimateMetrics(input: AdPlanInput): {
  costPerResult: string;
  reach: string;
  results: string;
} {
  const currency = CURRENCY_SYMBOLS[input.budgetCurrency] || input.budgetCurrency;
  const budget = input.budget;

  let cprLow: number, cprHigh: number, reachLow: number, reachHigh: number;

  const isLocal = !!input.location;
  const multiplier = isLocal ? 1.2 : 1;

  switch (input.budgetCurrency) {
    case 'NGN':
      cprLow = Math.round(200 * multiplier);
      cprHigh = Math.round(800 * multiplier);
      reachLow = Math.round(budget / cprHigh * 3);
      reachHigh = Math.round(budget / cprLow * 3);
      break;
    case 'USD':
      cprLow = Math.round(1 * multiplier);
      cprHigh = Math.round(5 * multiplier);
      reachLow = Math.round(budget / cprHigh * 3);
      reachHigh = Math.round(budget / cprLow * 3);
      break;
    case 'GBP':
      cprLow = Math.round(1 * multiplier);
      cprHigh = Math.round(4 * multiplier);
      reachLow = Math.round(budget / cprHigh * 3);
      reachHigh = Math.round(budget / cprLow * 3);
      break;
    case 'KES':
      cprLow = Math.round(50 * multiplier);
      cprHigh = Math.round(300 * multiplier);
      reachLow = Math.round(budget / cprHigh * 3);
      reachHigh = Math.round(budget / cprLow * 3);
      break;
    case 'GHS':
      cprLow = Math.round(5 * multiplier);
      cprHigh = Math.round(20 * multiplier);
      reachLow = Math.round(budget / cprHigh * 3);
      reachHigh = Math.round(budget / cprLow * 3);
      break;
    default:
      cprLow = Math.round(1 * multiplier);
      cprHigh = Math.round(5 * multiplier);
      reachLow = Math.round(budget / cprHigh * 3);
      reachHigh = Math.round(budget / cprLow * 3);
  }

  const resultLow = Math.round(budget / cprHigh);
  const resultHigh = Math.round(budget / cprLow);

  return {
    costPerResult: `${currency}${cprLow.toLocaleString()} - ${currency}${cprHigh.toLocaleString()} per lead`,
    reach: `${reachLow.toLocaleString()} - ${reachHigh.toLocaleString()} people`,
    results: `${resultLow} - ${resultHigh} leads or inquiries`,
  };
}

async function generateAdPlanWithClaude(input: AdPlanInput, intel: BusinessIntelligence): Promise<AdPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const currency = CURRENCY_SYMBOLS[input.budgetCurrency] || input.budgetCurrency;
  const competitorSummary = intel.topBusinesses.length > 0
    ? `Top competitors in area: ${intel.topBusinesses.slice(0, 5).map((b) => `${b.name} (${b.rating || 'N/A'} rating, ${b.reviews || 0} reviews)`).join(', ')}`
    : 'Limited competitor data available.';

  const prompt = `Create a complete digital advertising strategy for this business.

BUSINESS DETAILS:
- Name: ${input.businessName}
- Type: ${input.businessType}
- Primary Goal: ${input.goal}
- Monthly Budget: ${currency}${input.budget.toLocaleString()}
- Location: ${input.location || 'Not specified — target broadly'}
- Website: ${input.website || 'No website'}
- Extra context: ${input.extraContext || 'None provided'}

MARKET INTELLIGENCE (from live search data):
${competitorSummary}
Related keywords found: ${intel.relatedKeywords.slice(0, 8).join(', ')}
Market size: ${intel.marketSize}

CONTEXT:
- This is likely a business in Africa (Nigeria, Kenya, Ghana, or similar market)
- Mobile-first audience
- WhatsApp is heavily used for business communication
- Budget is in ${input.budgetCurrency}

${!input.website ? 'Note: No website. Recommend WhatsApp or phone call as the conversion action.' : ''}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "summary": "One paragraph overview of the recommended strategy",
  "audience": {
    "description": "Who to target and why",
    "age_min": 18,
    "age_max": 45,
    "age_primary": "25-35",
    "gender": "All",
    "gender_reasoning": "Why this gender targeting",
    "location_targeting": "Specific areas to target",
    "languages": ["English"]
  },
  "interests": [
    { "category": "Interest category", "specific": ["interest1", "interest2"], "reasoning": "Why relevant" }
  ],
  "behaviors": ["behavior1", "behavior2"],
  "platforms": [
    { "name": "Facebook", "priority": 1, "recommended": true, "reason": "Why", "budget_percentage": 40, "ad_format": "Format", "best_time": "When" }
  ],
  "budget_breakdown": {
    "total": ${input.budget},
    "currency": "${input.budgetCurrency}",
    "daily_budget": ${Math.round(input.budget / 30)},
    "duration_days": 30,
    "split": [{ "platform": "Facebook", "amount": 40000, "percentage": 40 }],
    "cost_per_result_estimate": "₦500 - ₦1,200 per lead",
    "estimated_reach": "15,000 - 45,000 people",
    "estimated_results": "80 - 200 leads"
  },
  "ad_copies": [
    { "platform": "Facebook/Instagram", "format": "Feed Ad", "headline": "...", "primary_text": "...", "call_to_action": "Book Now", "hook": "..." },
    { "platform": "Facebook/Instagram", "format": "Story Ad", "headline": "...", "primary_text": "...", "call_to_action": "Book Now", "hook": "..." },
    { "platform": "Google Search", "format": "Search Ad", "headline": "...", "primary_text": "...", "call_to_action": "Book Now", "hook": "" }
  ],
  "keywords": {
    "google_search": ["keyword1", "keyword2"],
    "hashtags_social": ["#tag1", "#tag2"],
    "negative_keywords": ["exclude1", "exclude2"]
  },
  "creative_direction": {
    "visual_style": "What images/videos should look like",
    "colors": "Color recommendations",
    "content_ideas": ["Idea 1", "Idea 2", "Idea 3"],
    "do": ["Best practice 1", "Best practice 2"],
    "dont": ["Avoid 1", "Avoid 2"]
  },
  "kpis": [
    { "metric": "Cost Per Lead", "target": "₦800 or less" },
    { "metric": "Click Through Rate", "target": "2% or higher" },
    { "metric": "Return on Ad Spend", "target": "3x minimum" }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: 'You are an expert digital advertising strategist with 10+ years experience running profitable ad campaigns for African and global businesses on Facebook, Instagram, TikTok, and Google. You always respond in valid JSON only. No markdown. No explanation outside JSON.',
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

  return JSON.parse(text) as AdPlan;
}

function generateSerpAdPlan(input: AdPlanInput, intel: BusinessIntelligence): AdPlan {
  const btKey = input.businessType.toLowerCase();
  const profile = BUSINESS_PROFILES[btKey] || DEFAULT_PROFILE;
  const goalConfig = GOAL_CONFIGS[input.goal] || GOAL_CONFIGS['Get More Customers'];
  const currency = CURRENCY_SYMBOLS[input.budgetCurrency] || input.budgetCurrency;
  const location = input.location || 'your target market';

  const competitorContext = intel.topBusinesses.length > 0
    ? `There are ${intel.topBusinesses.length} similar businesses found in ${location}, indicating ${intel.marketSize} market demand.`
    : `Limited competition data available for ${location}, which may indicate an untapped market opportunity.`;

  const summary = `This advertising strategy for ${input.businessName} focuses on ${goalConfig.focus} with a ${currency}${input.budget.toLocaleString()} monthly budget across multiple platforms. ${competitorContext} The campaign targets a mobile-first audience in ${location}, with emphasis on Facebook and Instagram for maximum reach and Google Search for high-intent leads. ${!input.website ? 'Since there\'s no website, the strategy prioritizes WhatsApp and phone call conversions.' : 'The strategy drives traffic to your website for conversions.'}`;

  const audience = {
    description: `Target people in ${location} who are actively interested in ${input.businessType.toLowerCase()} services. ${intel.topBusinesses.length > 0 ? `With ${intel.topBusinesses.length} competing businesses found, the audience is proven to exist and spend money in this category.` : 'This audience type shows strong demand based on search trends.'} Focus on mobile-first users who discover services through social media and Google search.`,
    age_min: 18,
    age_max: 55,
    age_primary: '25-40',
    gender: 'All',
    gender_reasoning: `${input.businessType} services appeal to all genders. Starting with broad targeting allows the algorithm to find the best-performing segments, which can be refined after the first week of data.`,
    location_targeting: input.location || 'Target broadly — online-only business',
    languages: ['English'],
  };

  const interests = profile.interests;
  const behaviors = profile.behaviors;
  const platforms = goalConfig.platformSplit;
  const keywords = generateKeywords(input, intel);
  const adCopies = generateAdCopies(input, goalConfig, intel);
  const creativeDirection = generateCreativeDirection(input, profile);
  const kpis = goalConfig.kpis;
  const tips = generateTips(input, intel);
  const metrics = estimateMetrics(input);

  const split = platforms
    .filter((p) => p.recommended)
    .map((p) => ({
      platform: p.name,
      amount: Math.round(input.budget * (p.percentage / 100)),
      percentage: p.percentage,
    }));

  const budgetBreakdown: AdPlan['budget_breakdown'] = {
    total: input.budget,
    currency: input.budgetCurrency,
    daily_budget: Math.round(input.budget / 30),
    duration_days: 30,
    split,
    cost_per_result_estimate: metrics.costPerResult,
    estimated_reach: metrics.reach,
    estimated_results: metrics.results,
  };

  const mappedPlatforms = platforms.map((p) => ({
    name: p.name,
    priority: p.priority,
    recommended: p.recommended,
    reason: p.reason,
    budget_percentage: p.recommended ? p.percentage : 0,
    ad_format: p.adFormat,
    best_time: p.bestTime,
  }));

  return {
    summary,
    audience,
    interests,
    behaviors,
    platforms: mappedPlatforms,
    budget_breakdown: budgetBreakdown,
    ad_copies: adCopies,
    keywords,
    creative_direction: creativeDirection,
    kpis,
    tips,
  };
}

export async function generateAdPlan(input: AdPlanInput): Promise<AdPlan> {
  const intel = await fetchBusinessIntelligence(input);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateAdPlanWithClaude(input, intel);
    } catch (err) {
      console.error('Anthropic failed, falling back to SerpAPI:', err);
    }
  }

  return generateSerpAdPlan(input, intel);
}
