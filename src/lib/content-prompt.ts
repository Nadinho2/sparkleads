import { getJson } from 'serpapi';
import { safeJsonParse } from './safe-json';
import { aiGenerateJSON } from './ai-client';

export interface ContentProfile {
  id?: string;
  user_token?: string;
  lead_id?: string | null;
  business_name: string;
  business_type: string;
  location?: string | null;
  website?: string | null;
  website_excerpt?: string | null;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  services?: string[] | null;
  tagline?: string | null;
  brand_voice?: string | null;
  target_audience?: string | null;
  usp?: string | null;
  brand_colors?: string[] | null;
  default_platforms?: string[] | null;
  always_include_phone?: boolean;
  always_include_handles?: boolean;
}

export interface Variation {
  id: number;
  approach: string;
  hook: string;
  caption: string;
  hashtags: string[];
  hashtag_count: number;
  hashtag_string: string;
  image_direction: string;
  video_direction: string;
  cta: string;
  best_time: string;
  format: string;
  emoji_suggestion: string;
  engagement_tip: string;
}

interface PlatformResult {
  variations: Variation[];
}

interface MarketIntelligence {
  trendingTopics: string[];
  competitorInsights: string[];
  popularQuestions: string[];
  contentAngles: string[];
  locationContext: string;
}

const VOICE_STYLES: Record<string, { emojis: string[]; tone: string; greeting: string }> = {
  professional: { emojis: ['📊', '✅', '📈', '💼', '🏆'], tone: 'polished and credible', greeting: '' },
  friendly: { emojis: ['😊', '💛', '🙌', '✨', '❤️'], tone: 'warm and approachable', greeting: 'Hey there!' },
  fun: { emojis: ['🎉', '🔥', '😂', '💪', '🥳'], tone: 'energetic and playful', greeting: 'Y\'all!' },
  luxury: { emojis: ['✨', '💎', '🥂', '👑', '🌟'], tone: 'premium and exclusive', greeting: '' },
  bold: { emojis: ['⚡', '🔥', '💯', '🚀', '🎯'], tone: 'confident and direct', greeting: 'Listen.' },
  educational: { emojis: ['📚', '💡', '🧠', '📝', '✅'], tone: 'informative and helpful', greeting: 'Did you know?' },
};

const GOAL_CTAS: Record<string, string[]> = {
  'Get more customers': ['Book now', 'DM us to book', 'Call us today', 'Walk in welcome', 'Reserve your spot'],
  'Promote a specific offer': ['Shop now', 'Grab yours before it\'s gone', 'Order now', 'Claim this offer', 'Don\'t miss out'],
  'Build brand awareness': ['Follow us for more', 'Share with a friend', 'Tag someone who needs this', 'Save this post', 'Follow for more'],
  'Drive website traffic': ['Link in bio', 'Visit our website', 'Click the link in bio', 'Check our website for details', 'Tap the link in bio'],
  'Get phone calls / WhatsApp messages': ['Call us now', 'WhatsApp us today', 'Send us a DM', 'Call for a free quote', 'WhatsApp for pricing'],
  'Grow followers': ['Follow us', 'Turn on notifications', 'Follow for daily tips', 'Join our community', 'Follow for more content'],
  'Showcase a product or service': ['DM for orders', 'Available now', 'Order yours today', 'Limited stock available', 'Get yours now'],
};

const BEST_TIMES: Record<string, string[]> = {
  instagram: ['Tue–Thu 7–9pm', 'Mon/Wed/Fri 11am–1pm', 'Sat 10am–12pm', 'Sun 6–8pm'],
  facebook: ['Wed–Fri 1–4pm', 'Tue/Thu 9–11am', 'Sat 12–2pm', 'Mon 7–9pm'],
  tiktok: ['Tue–Thu 7–10pm', 'Fri 5–8pm', 'Sat 10am–12pm', 'Sun 8–10pm'],
  twitter: ['Mon–Fri 8am–4pm', 'Wed 12–1pm', 'Tue/Thu 9–11am', 'Fri 3–4pm'],
  linkedin: ['Tue–Thu 7–8am', 'Wed 12pm', 'Mon/Wed 5–6pm', 'Tue 10–11am'],
  whatsapp: ['Mon–Sat 9am–6pm', 'Tue/Thu 10am–12pm', 'Fri 2–4pm'],
};

const PLATFORM_HASHTAGS: Record<string, string[]> = {
  instagram: ['instagood', 'photooftheday', 'explorepage', 'viral', 'reels', 'trending'],
  facebook: ['smallbusiness', 'supportlocal', 'community', 'shoplocal', 'localbusiness'],
  tiktok: ['fyp', 'foryoupage', 'viral', 'trending', 'tiktoknigeria', 'africantiktok'],
  twitter: ['trending', 'Nigeria', 'business', 'thread', 'TwitterNG'],
  linkedin: ['business', 'entrepreneurship', 'leadership', 'growth', 'professional'],
  whatsapp: ['whatsapp', 'deals', 'ordernow', 'directmessage'],
};

const NICHE_INSIGHTS: Record<string, {
  painPoints: string[];
  desires: string[];
  objections: string[];
  socialProof: string[];
  insiderLanguage: string[];
}> = {
  'hair salon': {
    painPoints: ['bad hair day', 'unreliable stylists', 'hair damage from chemicals', 'long wait times', 'not finding a style that suits your face'],
    desires: ['look and feel beautiful', 'get compliments everywhere they go', 'healthy hair that grows', 'a stylist who truly understands their hair texture', 'low-maintenance styles that last'],
    objections: ['too expensive', 'afraid of hair damage', 'had a bad experience before', 'not sure the style will suit me'],
    socialProof: ['clients who travel across town just for their hair', 'fully booked weekends', 'repeat customers for 3+ years', '5-star reviews praising attention to detail'],
    insiderLanguage: ['edges laid', 'silk press', 'protective styling', 'big chop', 'wash day', 'hair goals', 'slay'],
  },
  'restaurant': {
    painPoints: ['boring meal options', 'food delivery that arrives cold', 'overpriced restaurants with small portions', 'finding a good spot for date night', 'dietary restrictions not accommodated'],
    desires: ['food that reminds them of home', 'a dining experience worth sharing on social media', 'generous portions at fair prices', 'a go-to spot for every occasion'],
    objections: ['too pricey', 'what if the food is not good', 'hard to find parking', 'long wait for food'],
    socialProof: ['chef with 10+ years experience', 'signature dish that sells out weekly', 'celebrity visitors', 'over 500 positive Google reviews'],
    insiderLanguage: ['jollof wars', 'pepper dem', 'small chops', 'suya spot', 'chop life', 'foodie'],
  },
  'gym': {
    painPoints: ['gym intimidation', 'not seeing results', 'boring workouts', 'expensive memberships', 'lack of motivation to go consistently'],
    desires: ['transform their body', 'feel confident in their clothes', 'have energy all day', 'be part of a fitness community', 'learn proper form'],
    objections: ['too expensive', 'I\'ll start next month', 'I can work out at home', 'I don\'t want to bulk up', 'the gym is too far'],
    socialProof: ['member who lost 20kg in 6 months', 'trainers with certifications', '24/7 access', 'state-of-the-art equipment'],
    insiderLanguage: ['leg day', 'PR (personal record)', 'gains', 'transformation', 'no excuses', 'beast mode', 'consistency over motivation'],
  },
  'boutique': {
    painPoints: ['wearing the same outfit as someone else', 'clothes that don\'t fit right', 'fast fashion that falls apart', 'not finding unique pieces locally'],
    desires: ['stand out from the crowd', 'look expensive on a budget', 'find pieces nobody else has', 'look like their favorite influencer'],
    objections: ['too expensive', 'what if it doesn\'t fit', 'not sure about the quality', 'can I return it'],
    socialProof: ['pieces styled by local influencers', 'new arrivals that sell out within days', 'custom tailoring available', 'curated collections for every occasion'],
    insiderLanguage: ['slay', 'drip', 'outfit of the day', 'OOTD', 'style inspo', 'wardrobe refresh', 'statement piece'],
  },
  'real estate': {
    painPoints: ['scam properties', 'hidden fees', 'agents who don\'t listen', 'taking too long to find the right place', 'overpriced listings'],
    desires: ['own their dream home', 'find an affordable apartment in a good location', 'a trustworthy agent who won\'t waste their time', 'invest in property that appreciates'],
    objections: ['too expensive', 'I\'m not ready to buy', 'I don\'t trust agents', 'the market is too volatile'],
    socialProof: ['hundreds of families housed', 'verified listings only', 'no hidden fees', 'free property inspection', 'client who got their keys in 2 weeks'],
    insiderLanguage: ['landlord', 'rentage', 'mini flat', 'self-contain', 'serviced apartment', 'off-plan', 'C of O', 'omo onile'],
  },
  'pharmacy': {
    painPoints: ['fake medications', 'long queues', 'out-of-stock medicines', 'no pharmacist to ask questions', 'overpriced drugs'],
    desires: ['genuine medications', 'fast service', 'professional health advice', 'affordable prices', 'home delivery'],
    objections: ['too expensive', 'are these original drugs', 'I can get it cheaper elsewhere'],
    socialProof: ['licensed pharmacists on duty', '24/7 service', 'delivery within 1 hour', 'over 10,000 products in stock'],
    insiderLanguage: ['original drugs', 'over the counter', 'prescription refill', 'health consult', 'drug interaction check'],
  },
  'hotel': {
    painPoints: ['dirty rooms', 'rude staff', 'noisy environment', 'wifi that doesn\'t work', 'photos don\'t match reality'],
    desires: ['a clean, comfortable stay', 'feel at home away from home', 'Instagram-worthy room', 'good value for money', 'reliable wifi for work'],
    objections: ['too expensive', 'the reviews look fake', 'I found a cheaper option', 'is breakfast included'],
    socialProof: ['90% guest satisfaction rate', '5-star TripAdvisor rating', 'repeat corporate clients', 'award-winning restaurant on-site'],
    insiderLanguage: ['room service', 'late checkout', 'suite upgrade', 'complimentary breakfast', 'concierge'],
  },
};

const DEFAULT_INSIGHTS = {
  painPoints: ['finding reliable service providers', 'overpaying for mediocre results', 'poor customer service', 'wasting time on unprofessional businesses'],
  desires: ['quality service they can trust', 'fair pricing with no hidden charges', 'professional and reliable providers', 'a business that values their time'],
  objections: ['is it worth the price', 'can I trust them', 'what if I\'m not satisfied', 'do they deliver on their promises'],
  socialProof: ['happy customers who keep coming back', 'years of experience in the industry', 'quick response time', 'personalized service'],
  insiderLanguage: ['quality', 'reliable', 'trusted', 'professional', 'best in town'],
};

async function fetchMarketIntelligence(profile: ContentProfile): Promise<MarketIntelligence> {
  const location = profile.location || 'Nigeria';
  const bt = profile.business_type;

  const results = await Promise.allSettled([
    getJson({
      engine: 'google',
      q: `${bt} ${location} trending 2025`,
      num: 8,
      api_key: process.env.SERPAPI_KEY,
    }),
    getJson({
      engine: 'google',
      q: `${bt} social media post ideas what customers want`,
      num: 8,
      api_key: process.env.SERPAPI_KEY,
    }),
    getJson({
      engine: 'google',
      q: `${bt} ${location} top rated reviews`,
      num: 5,
      api_key: process.env.SERPAPI_KEY,
    }),
    getJson({
      engine: 'google',
      q: `how to attract more ${bt.toLowerCase()} customers ${location}`,
      num: 5,
      api_key: process.env.SERPAPI_KEY,
    }),
  ]);

  const trendingTopics: string[] = [];
  const competitorInsights: string[] = [];
  const popularQuestions: string[] = [];
  const contentAngles: string[] = [];

  if (results[0].status === 'fulfilled') {
    const organic = results[0].value.organic_results || [];
    for (const r of organic.slice(0, 5)) {
      if (r.snippet) trendingTopics.push((r.snippet as string).slice(0, 120));
      if (r.title) contentAngles.push((r.title as string).slice(0, 80));
    }
    const related = results[0].value.related_searches || [];
    for (const r of related.slice(0, 3)) {
      if (r.query) trendingTopics.push(r.query as string);
    }
  }

  if (results[1].status === 'fulfilled') {
    const organic = results[1].value.organic_results || [];
    for (const r of organic.slice(0, 4)) {
      if (r.snippet) competitorInsights.push((r.snippet as string).slice(0, 150));
    }
    const related = results[1].value.related_searches || [];
    for (const r of related.slice(0, 3)) {
      if (r.query) popularQuestions.push(r.query as string);
    }
  }

  if (results[2].status === 'fulfilled') {
    const organic = results[2].value.organic_results || [];
    for (const r of organic.slice(0, 3)) {
      if (r.snippet) competitorInsights.push((r.snippet as string).slice(0, 150));
    }
  }

  if (results[3].status === 'fulfilled') {
    const organic = results[3].value.organic_results || [];
    for (const r of organic.slice(0, 3)) {
      if (r.title) popularQuestions.push((r.title as string).slice(0, 100));
      if (r.snippet) contentAngles.push((r.snippet as string).slice(0, 120));
    }
  }

  return {
    trendingTopics: Array.from(new Set(trendingTopics)).slice(0, 8),
    competitorInsights: Array.from(new Set(competitorInsights)).slice(0, 6),
    popularQuestions: Array.from(new Set(popularQuestions)).slice(0, 6),
    contentAngles: Array.from(new Set(contentAngles)).slice(0, 8),
    locationContext: location,
  };
}

async function fetchHashtags(businessType: string, location: string): Promise<string[]> {
  try {
    const results = await getJson({
      engine: 'google',
      q: `${businessType} ${location} instagram hashtags trending`,
      num: 5,
      api_key: process.env.SERPAPI_KEY,
    });

    const hashtags: string[] = [];
    const organic = results.organic_results || [];
    for (const result of organic.slice(0, 3)) {
      if (result.snippet) {
        const found = (result.snippet as string).match(/#\w+/g);
        if (found) hashtags.push(...found.slice(0, 5).map((h) => h.replace(/^#/, '')));
      }
    }
    return hashtags.slice(0, 10);
  } catch {
    return [];
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getNicheInsights(businessType: string) {
  const bt = businessType.toLowerCase();
  for (const [key, value] of Object.entries(NICHE_INSIGHTS)) {
    if (bt.includes(key)) return value;
  }
  const words = bt.split(/[\s,]+/).filter(w => w.length > 2);
  for (const [key, value] of Object.entries(NICHE_INSIGHTS)) {
    const keyWords = key.split(' ');
    if (words.some(w => keyWords.includes(w))) return value;
  }
  return DEFAULT_INSIGHTS;
}

function buildServiceLine(profile: ContentProfile): string {
  if (!profile.services?.length) return '';
  const all = profile.services;
  if (all.length <= 2) return all.join(' and ');
  const pick = pickMultiple(all, Math.min(3, all.length));
  return pick.join(', ');
}

function buildAudienceLine(profile: ContentProfile): string {
  if (profile.target_audience) return profile.target_audience;
  return `people who need ${profile.business_type.toLowerCase()} services in ${profile.location || 'their area'}`;
}

function buildNicheHashtags(profile: ContentProfile, location: string): string[] {
  const bt = profile.business_type.toLowerCase();
  const city = location.split(',')[0]?.trim() || '';
  const tags: string[] = [];

  const baseTags: Record<string, string[]> = {
    salon: ['#hairgoals', '#naturalhair', '#hairstyles', '#salonlife', '#hairtransformation', '#silkpress', '#braiding', '#protectivestyles', '#edges', '#beautysalon'],
    restaurant: ['#foodie', '#foodporn', '#instafood', '#foodstagram', '#eattlocal', '#cheflife', '#foodlover', '#yummy', '#delicious', '#foodphotography'],
    gym: ['#fitnessmotivation', '#gym', '#workout', '#fitness', '#fitfam', '#gymtime', '#training', '#bodybuilding', '#healthylifestyle', '#transformation'],
    hotel: ['#hotel', '#travel', '#hospitality', '#hotelroom', '#vacation', '#luxuryhotel', '#travelgram', '#hotelreview', '#accommodation', '#booking'],
    pharmacy: ['#health', '#wellness', '#pharmacy', '#healthcare', '#medication', '#healthtips', '#wellbeing', '#pharmacylife', '#selfcare'],
    boutique: ['#fashion', '#ootd', '#style', '#fashionista', '#outfitoftheday', '#shopping', '#trendy', '#fashionstyle', '#lookoftheday', '#styleinspo'],
    'real estate': ['#realestate', '#property', '#homeforsale', '#dreamhome', '#propertyforsale', '#househunting', '#realtor', '#investment', '#newhome'],
    spa: ['#spa', '#selfcare', '#relaxation', '#skincare', '#beauty', '#pamper', '#massagetherapy', '#spalife', '#glowup', '#treatyourself'],
    bakery: ['#bakery', '#cakes', '#pastries', '#baking', '#cakedesign', '#homemade', '#desserts', '#bakersofinstagram', '#customcake', '#birthdaycake'],
  };

  for (const [key, value] of Object.entries(baseTags)) {
    if (bt.includes(key)) {
      tags.push(...pickMultiple(value, 5));
      break;
    }
  }

  if (tags.length === 0) {
    tags.push(`${bt.replace(/\s+/g, '')}`, `${bt.replace(/\s+/g, '')}life`);
  }

  if (city && city.toLowerCase() !== 'your area') {
    tags.push(`${city.replace(/\s+/g, '')}`, `${city.replace(/\s+/g, '')}${bt.replace(/\s+/g, '')}`);
  }

  return Array.from(new Set(tags));
}

const CAPTION_STRUCTURES = {
  story: (hook: string, body: string, ctaLine: string, emoji: string) =>
    `${emoji} ${hook}\n\n${body}\n\n${ctaLine}`,

  question: (hook: string, body: string, ctaLine: string, emoji: string) =>
    `${emoji} ${hook}\n\n${body}\n\n${ctaLine}`,

  list: (hook: string, items: string[], ctaLine: string, emoji: string) =>
    `${hook}\n\n${items.map((item) => `${emoji} ${item}`).join('\n')}\n\n${ctaLine}`,

  problem_solution: (problem: string, solution: string, ctaLine: string, emoji: string) =>
    `${problem}\n\n${emoji} ${solution}\n\n${ctaLine}`,

  testimonial_style: (hook: string, quote: string, ctaLine: string, emoji: string) =>
    `${emoji} ${hook}\n\n"${quote}"\n\n${ctaLine}`,

  urgency: (hook: string, offer: string, ctaLine: string, emoji: string) =>
    `${hook}\n\n${emoji} ${offer}\n\n${ctaLine}`,
};

function buildSmartVariation(
  id: number,
  profile: ContentProfile,
  platform: string,
  contentType: string,
  goal: string,
  voice: string,
  extraContext: string | undefined,
  trendingHashtags: string[],
  intel: MarketIntelligence
): Variation {
  const voiceStyle = VOICE_STYLES[voice] || VOICE_STYLES['friendly'];
  const ctas = GOAL_CTAS[goal] || GOAL_CTAS['Build brand awareness'];
  const bestTimes = BEST_TIMES[platform] || BEST_TIMES['instagram'];
  const platformTags = PLATFORM_HASHTAGS[platform] || PLATFORM_HASHTAGS['instagram'];
  const niche = getNicheInsights(profile.business_type);

  const location = profile.location || '';
  const locPhrase = location ? ` in ${location}` : '';
  const locCommunity = location ? `the ${location} community` : 'our community';
  const locArea = location ? location : 'your area';
  const name = profile.business_name;
  const bt = profile.business_type;
  const services = buildServiceLine(profile);
  const audience = buildAudienceLine(profile);
  const emoji = voiceStyle.emojis[id % voiceStyle.emojis.length];
  const cta = pickRandom(ctas);
  const bestTime = pickRandom(bestTimes);

  const handles: Record<string, string | null> = {
    instagram: profile.instagram ? `@${profile.instagram}` : null,
    facebook: profile.facebook || null,
    tiktok: profile.tiktok ? `@${profile.tiktok}` : null,
    twitter: profile.twitter ? `@${profile.twitter}` : null,
  };
  const handle = handles[platform] || handles['instagram'] || `@${name.replace(/\s+/g, '').toLowerCase()}`;
  const whatsapp = profile.whatsapp || profile.phone;

  const ctaLine = whatsapp
    ? `${cta} — WhatsApp us at ${whatsapp}${handle ? ` or DM ${handle}` : ''}`
    : `${cta} — ${handle ? `DM ${handle}` : 'Contact us'}`;

  const painPoint = pickRandom(niche.painPoints);
  const desire = pickRandom(niche.desires);
  const objection = pickRandom(niche.objections);
  const socialProof = pickRandom(niche.socialProof);
  const slang = pickRandom(niche.insiderLanguage);

  const intelContext = intel.trendingTopics.length > 0 ? pickRandom(intel.trendingTopics) : '';
  const competitorRef = intel.competitorInsights.length > 0 ? pickRandom(intel.competitorInsights) : '';

  const uspLine = profile.usp || '';
  const tagline = profile.tagline || '';
  const serviceDisplay = services || bt;

  let hook = '';
  let caption = '';
  let format = pickRandom(['Single Image', 'Carousel', 'Reel', 'Story'] as const) as string;
  let imageDir = '';
  let videoDir = '';

  const structures = ['story', 'question', 'list', 'problem_solution', 'testimonial_style', 'urgency'];
  const structure = structures[id % structures.length];

  switch (contentType) {
    case 'Promotional':
      if (structure === 'urgency') {
        hook = `⏰ This is not a drill — ${name} has something special for you`;
        caption = CAPTION_STRUCTURES.urgency(
          hook,
          `${extraContext || `We're offering exclusive deals on ${serviceDisplay} for a limited time only`}. ${uspLine ? `${uspLine}.` : ''} This is for the people${locPhrase} who've been waiting for the right moment.`,
          ctaLine,
          emoji
        );
      } else if (structure === 'story') {
        hook = `The moment you realize your ${bt.toLowerCase()} actually gets it right`;
        caption = CAPTION_STRUCTURES.story(
          hook,
          `At ${name}, we don't just offer ${serviceDisplay} — we create experiences that keep you coming back. ${socialProof ? `Known for being ${socialProof}.` : ''} ${tagline ? `"${tagline}"` : ''} Serving ${locCommunity} with pride.`,
          ctaLine,
          emoji
        );
      } else {
        hook = `${name} said: let's make ${locArea} look good this week ${slang ? `— ${slang}` : ''}`;
        caption = CAPTION_STRUCTURES.question(
          hook,
          `${extraContext || `Our ${serviceDisplay} is exactly what you need right now`}. ${uspLine ? `Why us? ${uspLine}.` : ''} We're not just another ${bt.toLowerCase()} — we're the one your friends keep recommending.`,
          ctaLine,
          emoji
        );
      }
      format = pickRandom(['Single Image', 'Carousel', 'Story']);
      imageDir = `Eye-catching promotional graphic featuring ${serviceDisplay} with bold offer text. Include ${name} branding and the specific deal. Use warm, inviting colors.`;
      break;

    case 'Educational':
      if (structure === 'list') {
        const tips = [
          `Always check the quality before committing`,
          `Ask about the process — a good ${bt.toLowerCase()} will explain everything`,
          `Don't settle for the first option you find`,
          `Look for reviews from real customers${locPhrase}`,
          `Communication is key — make sure they understand what you want`,
        ];
        hook = `${pickMultiple(tips, 1)[0].slice(0, 60)}... here's what most people get wrong`;
        caption = CAPTION_STRUCTURES.list(
          hook,
          pickMultiple(tips, 3),
          `${ctaLine} — we're here to help you make the right choice`,
          emoji
        );
        format = 'Carousel';
      } else if (structure === 'problem_solution') {
        hook = `Stop making this mistake with your ${bt.toLowerCase().includes('salon') ? 'hair' : bt.toLowerCase()}`;
        caption = CAPTION_STRUCTURES.problem_solution(
          hook,
          `Most people${locPhrase} ${painPoint} — but it doesn't have to be that way. At ${name}, we ${desire}. ${uspLine ? `Here's our approach: ${uspLine}.` : ''} ${services ? `Our ${services} service is designed to give you exactly what you need.` : ''}`,
          `${ctaLine} — let us show you the difference`,
          emoji
        );
        format = 'Reel';
      } else {
        hook = `Here's something nobody tells you about ${serviceDisplay}`;
        caption = CAPTION_STRUCTURES.story(
          hook,
          `After years of serving ${locCommunity}, we've learned what really works. ${niche.insiderLanguage.length > 0 ? `In the ${bt.toLowerCase()} world, we call it "${slang}" — and it makes all the difference.` : ''} ${audience ? `This is especially important if you're ${audience}.` : ''}`,
          `${ctaLine} — follow us for more insider tips`,
          emoji
        );
        format = 'Carousel';
      }
      imageDir = `Clean educational carousel with bold numbered tips. Each slide should have one key takeaway with supporting illustration. Use brand colors and ${name} logo on the last slide.`;
      break;

    case 'Engagement':
      if (structure === 'question') {
        hook = `Quick question${locPhrase} — help us settle this`;
        caption = CAPTION_STRUCTURES.question(
          hook,
          `When it comes to ${serviceDisplay}, what matters most to you? We genuinely want to know because ${name} is built on what YOU need, not what we think you should want. Drop your answer below ${emoji}`,
          `Tag someone who needs to see this and follow ${handle} for more`,
          emoji
        );
        format = 'Story';
      } else {
        hook = `Tag someone who ${painPoint} and needs ${name} in their life`;
        caption = CAPTION_STRUCTURES.story(
          hook,
          `You know that friend who's always complaining about ${painPoint}? Send them our way. At ${name}${locPhrase}, we ${desire}. ${socialProof ? `We're known for ${socialProof}.` : ''}`,
          `Tag them below and follow ${handle} for more ${emoji}`,
          emoji
        );
        format = 'Single Image';
      }
      imageDir = `Bold question text on a vibrant branded background. Make it readable at a glance. Include ${name} logo subtly in the corner.`;
      break;

    case 'Behind the Scenes':
      hook = `Ever wondered what really goes on behind the scenes at ${name}?`;
      if (structure === 'story') {
        caption = CAPTION_STRUCTURES.story(
          hook,
          `${emoji} Here's a peek behind the curtain. At ${name}, every ${services || 'service'} starts with ${pickRandom(['careful preparation', 'attention to detail', 'a passion for excellence', 'understanding what you really need'])}. ${location ? `Our ${location} team takes pride in every detail.` : ''} ${tagline ? `Our motto: "${tagline}"` : ''}`,
          `${ctaLine} — come experience it yourself`,
          emoji
        );
      } else {
        caption = CAPTION_STRUCTURES.list(
          hook,
          [
            `We start every day by ${pickRandom(['reviewing our appointments', 'preparing fresh materials', 'setting up our space', 'checking quality standards'])}`,
            `Our team of ${pickRandom(['skilled professionals', 'dedicated experts', 'passionate creators'])} works together to deliver the best`,
            `Every detail matters — from ${pickRandom(['the products we use', 'the environment we create', 'the way we communicate', 'the results we deliver'])}`,
          ],
          ctaLine,
          emoji
        );
      }
      format = 'Reel';
      imageDir = `Casual, authentic footage of the ${bt.toLowerCase()} in action. Show real workspace, real team members, real processes. Raw phone footage works best for this format — don't over-produce.`;
      videoDir = `Walk-through style video: start with arriving at the workspace, show key moments of the process, end with the finished result. Use trending audio. Keep it under 30 seconds.`;
      break;

    case 'Product/Service Highlight':
      if (structure === 'problem_solution') {
        hook = `Looking for ${serviceDisplay}${locPhrase}? Read this first`;
        caption = CAPTION_STRUCTURES.problem_solution(
          `Not all ${bt.toLowerCase()} services${locPhrase} are created equal. ${objection ? `We hear it all the time: "${objection}"` : ''} ${competitorRef ? `Here's what we've noticed about the market: ${competitorRef}.` : ''}`,
          `At ${name}, ${uspLine || `we do things differently`}. ${services ? `Our specialty: ${services}.` : ''} ${socialProof ? `${socialProof.charAt(0).toUpperCase() + socialProof.slice(1)}.` : ''} ${audience ? `Perfect for ${audience}.` : ''}`,
          ctaLine,
          emoji
        );
      } else if (structure === 'testimonial_style') {
        hook = `Don't take our word for it — here's what ${locArea} is saying about ${name}`;
        caption = CAPTION_STRUCTURES.testimonial_style(
          hook,
          `I tried so many ${bt.toLowerCase()} places before finding ${name}. ${desire ? `Finally, somewhere that ${desire}.` : 'The difference is night and day.'} ${uspLine ? `What I love most: ${uspLine}.` : ''}`,
          `${ctaLine} — join our happy customers`,
          emoji
        );
      } else {
        hook = `This is why ${name} is the ${bt.toLowerCase()} ${locArea} keeps talking about`;
        caption = CAPTION_STRUCTURES.story(
          hook,
          `${services ? `Our ${services} service` : `What we do`} isn't just about the end result — it's about the experience. ${uspLine ? `${uspLine}.` : ''} ${audience ? `Designed for ${audience}.` : ''} ${socialProof ? `Known for: ${socialProof}.` : ''}`,
          ctaLine,
          emoji
        );
      }
      format = pickRandom(['Carousel', 'Single Image', 'Reel']);
      imageDir = `High-quality showcase of ${serviceDisplay}. Include close-up details, the process, and the end result. If it's a service, show before/after. If it's a product, show it in use. Professional but authentic.`;
      break;

    case 'Testimonial':
      hook = `This message from a ${name} customer made our entire week ${emoji}`;
      if (structure === 'testimonial_style') {
        caption = CAPTION_STRUCTURES.testimonial_style(
          hook,
          `I was skeptical at first because ${objection || 'I\'d been disappointed before'}. But ${name} changed everything. ${desire ? `They helped me ${desire}.` : 'The results speak for themselves.'} Now I tell everyone${locPhrase} about them.`,
          `${ctaLine} — your story could be next`,
          emoji
        );
      } else {
        caption = CAPTION_STRUCTURES.story(
          hook,
          `We don't just provide ${serviceDisplay} — we build relationships. ${socialProof ? `Our reputation: ${socialProof}.` : ''} Every customer who walks through our doors leaves with a smile. ${location ? `Proudly serving ${location}.` : ''}`,
          `${ctaLine} — become part of the ${name} family`,
          emoji
        );
      }
      format = pickRandom(['Single Image', 'Carousel', 'Reel']);
      imageDir = `Screenshot of a real customer review or testimonial with a branded frame. Alternatively, a before/after comparison with the customer's permission. Keep it authentic — avoid overly polished testimonial graphics.`;
      break;

    case 'Seasonal/Holiday':
      hook = `${pickRandom(['This season', 'This month', 'Right now'])}, treat yourself to something special at ${name}`;
      caption = CAPTION_STRUCTURES.urgency(
        hook,
        `${extraContext || `${name} in ${locArea} is celebrating with exclusive offers on ${serviceDisplay}`}. ${uspLine ? `${uspLine}.` : ''} Don't miss this — it won't last forever.`,
        ctaLine,
        emoji
      );
      format = pickRandom(['Single Image', 'Story', 'Reel']);
      imageDir = `Festive themed graphic incorporating ${name} branding with seasonal colors and decorations. Show the specific offer prominently. Include a deadline or countdown element.`;
      break;

    case 'Announcement':
      hook = `Big news from ${name}${locPhrase} — you're going to want to hear this`;
      if (structure === 'story') {
        caption = CAPTION_STRUCTURES.story(
          hook,
          `${emoji} We've been working on something exciting and it's finally here. ${extraContext || `New things are coming to ${name} that will change how you experience ${serviceDisplay}`}. ${tagline ? `"${tagline}" — and we mean it more than ever.` : ''}`,
          `${ctaLine} — stay tuned for more updates`,
          emoji
        );
      } else {
        caption = CAPTION_STRUCTURES.urgency(
          hook,
          `${extraContext || `${name} is evolving${locPhrase ? `, and we're taking ${locArea} along for the ride` : ''}`}. ${uspLine ? `${uspLine}.` : ''} This is just the beginning.`,
          `${ctaLine} — turn on notifications so you don't miss what's next`,
          emoji
        );
      }
      format = pickRandom(['Single Image', 'Carousel', 'Reel']);
      imageDir = `Bold announcement graphic with large text and ${name} branding. Use a teaser style if the full reveal is coming later. Include the date/time if relevant. Clean, modern design.`;
      break;

    default:
      hook = `${name} — ${desire}`;
      caption = CAPTION_STRUCTURES.story(
        hook,
        `At ${name}${locPhrase}, we understand what ${audience} really need. ${services ? `We specialize in ${services}.` : ''} ${uspLine ? `What makes us different: ${uspLine}.` : ''} ${socialProof ? `${socialProof.charAt(0).toUpperCase() + socialProof.slice(1)}.` : ''} ${intelContext ? `Trending now: ${intelContext}.` : ''}`,
        ctaLine,
        emoji
      );
      format = 'Single Image';
      imageDir = `Clean, professional image showcasing ${name} and what makes the business special. Use real photos, not stock images.`;
  }

  if (extraContext && !caption.includes(extraContext)) {
    caption = caption.replace(ctaLine, `${extraContext}\n\n${ctaLine}`);
  }

  const nicheTags = buildNicheHashtags(profile, location);
  const locationTags = location ? [`${location.split(',')[0]?.trim().replace(/\s+/g, '')}`, `${location.split(',')[0]?.trim().replace(/\s+/g, '')}Business`] : [];

  const allHashtags = Array.from(new Set([
    ...nicheTags,
    ...locationTags,
    ...pickMultiple(trendingHashtags, 3),
    ...pickMultiple(platformTags, 3),
  ].map((t) => String(t).replace(/^#/, '')))).slice(0, 15);

  const platformEngagementTips: Record<string, string[]> = {
    instagram: [
      'Post Reels — they get 2x more reach than static posts. Use trending audio.',
      'Reply to every comment in the first 30 minutes to boost the algorithm.',
      'Use the carousel format for educational content — saves boost reach.',
      'Share to your Story with a poll or question sticker for extra engagement.',
    ],
    facebook: [
      'Ask a question at the end of your caption to encourage comments.',
      'Facebook Groups in your niche are gold — share your content there.',
      'Go Live once a week — Facebook pushes live video to more followers.',
      'Pin your best post to the top of your page for new visitors.',
    ],
    tiktok: [
      'Hook viewers in the first 1.5 seconds — that\'s all you get.',
      'Use trending sounds even if the content is original.',
      'Post 1-3 times per day for maximum algorithm exposure.',
      'Reply to comments with a video — TikTok loves this.',
    ],
    twitter: [
      'Thread your tips into a numbered list — threads get 3x more engagement.',
      'Quote-tweet positive mentions to build social proof.',
      'Tweet during lunch hours (12-1 PM) for maximum visibility.',
      'Use Twitter polls to spark conversation and gather insights.',
    ],
    linkedin: [
      'Share lessons learned — vulnerability performs well on LinkedIn.',
      'Tag relevant people and companies to expand your reach.',
      'Use LinkedIn\'s newsletter feature to build a subscriber base.',
      'Post on Tuesday-Thursday mornings for peak engagement.',
    ],
    whatsapp: [
      'Keep messages short and action-oriented — people scan WhatsApp fast.',
      'Use WhatsApp Status for time-sensitive offers and updates.',
      'Create a broadcast list for your VIP customers.',
      'Always include your contact info and a clear next step.',
    ],
  };

  return {
    id,
    approach: APPROACH_NAMES[(id - 1) % APPROACH_NAMES.length],
    hook,
    caption,
    hashtags: allHashtags,
    hashtag_count: allHashtags.length,
    hashtag_string: allHashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' '),
    image_direction: imageDir,
    video_direction: videoDir,
    cta,
    best_time: bestTime,
    format,
    emoji_suggestion: voiceStyle.emojis.slice(0, 3).join(' '),
    engagement_tip: pickRandom(platformEngagementTips[platform] || platformEngagementTips['instagram']),
  };
}

const APPROACH_NAMES = ['Hook-based', 'Problem/Solution', 'Social proof', 'Direct promotional', 'Educational'];

export function buildContentPrompt(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  extraContext?: string,
  toneOverride?: string
): string {
  const voice = toneOverride || profile.brand_voice || 'friendly';
  const location = profile.location || 'Nigeria';
  const services = profile.services?.join(', ') || profile.business_type;
  const whatsapp = profile.whatsapp || profile.phone;

  const platformHandles = platforms
    .map(p => {
      const handle = profile[p as keyof ContentProfile];
      return handle ? `${p}: @${handle}` : null;
    })
    .filter(Boolean)
    .join(', ');

  return `
You are a professional social media copywriter.
Write content ONLY for this specific business.
Do NOT mix in terminology, analogies, or references from other industries.

BUSINESS:
Name: ${profile.business_name}
Industry: ${profile.business_type}
Services offered: ${services}
Location: ${location}
Unique selling point: ${profile.usp || 'Quality service and expertise'}
Target audience: ${profile.target_audience || 'Local customers in ' + location}
Brand voice: ${voice}
WhatsApp: ${whatsapp || 'not provided'}
Social handles: ${platformHandles || 'not provided'}
Extra context for this post: ${extraContext || 'none'}
${profile.website_excerpt ? `
WEBSITE CONTENT (use this to understand the business better):
"${String(profile.website_excerpt).slice(0, 1500)}"

Use specific details from this website content in the generated posts
where relevant. Reference actual services, offers, or language from
the website. Do not invent details not found here or in the profile.
` : ''}

MARKET KNOWLEDGE:
Apply your real knowledge of:
- Who actually consumes "${profile.business_type}" content in "${profile.location || 'this market'}"
- What content formats perform best on each platform in this market
- Local trends, slang, and cultural references that resonate
- Peak engagement times for this audience in this timezone
- Whether to use formal language, local dialect, or a mix
- Local hashtags that actually drive discovery in this market
- Seasonal or cultural events coming up that could be referenced

Do not apply generic Western social media best practices
if the business is in a different market. Use market-specific knowledge.

CONTENT REQUEST:
Platforms: ${platforms.join(', ')}
Content type: ${contentType}
Goal: ${goal}

STRICT RULES:
- Write ONLY about ${profile.business_name} and their actual services
- NEVER use metaphors or terms from unrelated industries
- NEVER use the word "silk press" unless this is a hair business
- Each caption must have clear paragraph breaks (use actual line breaks)
- Structure every caption like this:

LINE 1: Strong hook — one punchy sentence that stops scrolling
[blank line]
LINE 2-3: Body — value, story, or offer details. 2 sentences max per paragraph.
[blank line]
LINE 4: Social proof or benefit — one sentence
[blank line]
LINE 5: CTA — clear action. Include WhatsApp number if provided.
LINE 6: Handle mention if provided

- Hashtags must be on a SEPARATE line from the caption
- Generate hashtags WITHOUT the # symbol in the array
- hashtag_string must have a SPACE between each hashtag (e.g. "#tag1 #tag2 #tag3")
- Write as if a real human from ${location} wrote this
- Match voice strictly: ${voice}
  professional = formal, no slang
  friendly = warm, conversational, light emojis
  fun = playful, upbeat, more emojis
  luxury = elegant, aspirational, minimal emojis
  bold = direct, confident, urgent
  educational = informative, helpful, clear

IMPORTANT:
The 5 variations must be genuinely different approaches:
- Variation 1: Hook-based (opens with a surprising statement)
- Variation 2: Problem/Solution (identify pain point, offer solution)
- Variation 3: Social proof / results focused
- Variation 4: Direct promotional (offer, price, urgency)
- Variation 5: Educational / value-first

Return ONLY valid JSON. No markdown. No explanation. Just JSON.

{
  "platforms": {
    "instagram": {
      "variations": [
        {
          "id": 1,
          "approach": "Hook-based",
          "hook": "Single line hook only",
          "caption": "Line 1 hook\\n\\nLine 2-3 body paragraph\\n\\nLine 4 benefit or proof\\n\\nLine 5 CTA with WhatsApp/handle",
          "hashtags": ["relevanthashtag1", "relevanthashtag2", "niche3", "location4", "brand5"],
          "hashtag_string": "#relevanthashtag1 #relevanthashtag2 #niche3 #location4 #brand5",
          "image_direction": "Practical description of what to photograph with a phone. Be specific.",
          "video_direction": "30-second reel concept if applicable",
          "cta": "The standalone CTA sentence",
          "best_time": "e.g. Tuesday–Thursday, 7pm–9pm",
          "format": "Single Image | Carousel | Reel | Story",
          "emoji_suggestion": "2-3 relevant emojis to use",
          "engagement_tip": "One specific tip to boost comments or shares"
        }
      ]
    }
  }
}

Generate for these platforms only: ${platforms.join(', ')}
Each platform gets exactly 5 variations.
`;
}

async function generateContentWithAI(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  extraContext?: string,
  toneOverride?: string
): Promise<{ platforms: Record<string, PlatformResult> }> {
  const prompt = buildContentPrompt(profile, platforms, contentType, goal, extraContext, toneOverride);
  return await aiGenerateJSON<{ platforms: Record<string, PlatformResult> }>({
    prompt,
    systemInstruction: 'You are a professional social media copywriter. You write content that sounds human, specific, and engaging. You NEVER use generic templates or metaphors from unrelated industries. Always respond in valid JSON only.',
    temperature: 0.8,
    maxOutputTokens: 8000,
  });
}

async function generateContentWithClaude(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  _trendingHashtags: string[],
  _variationCount: number,
  _intel: MarketIntelligence,
  extraContext?: string,
  toneOverride?: string
): Promise<{ platforms: Record<string, PlatformResult> }> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const prompt = buildContentPrompt(profile, platforms, contentType, goal, extraContext, toneOverride);

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
      system: 'You are a professional social media copywriter. You write content that sounds human, specific, and engaging. You NEVER use generic templates or metaphors from unrelated industries. Always respond in valid JSON only.',
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

  return safeJsonParse<{ platforms: Record<string, PlatformResult> }>(text);
}

function generateSerpContent(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  trendingHashtags: string[],
  variationCount: number,
  intel: MarketIntelligence,
  extraContext?: string,
  toneOverride?: string
): { platforms: Record<string, PlatformResult> } {
  const voice = toneOverride || profile.brand_voice || 'friendly';
  const result: Record<string, PlatformResult> = {};

  for (const platform of platforms) {
    const variations: Variation[] = [];
    for (let i = 0; i < variationCount; i++) {
      variations.push(
        buildSmartVariation(i + 1, profile, platform, contentType, goal, voice, extraContext, trendingHashtags, intel)
      );
    }
    result[platform] = { variations };
  }

  return { platforms: result };
}

export async function generateContent(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  extraContext?: string,
  toneOverride?: string,
  variationCount: number = 5
): Promise<{ platforms: Record<string, PlatformResult> }> {
  const location = profile.location || 'Nigeria';

  const [trendingHashtags, intel] = await Promise.all([
    fetchHashtags(profile.business_type, location),
    fetchMarketIntelligence(profile),
  ]);

  // Try DeepSeek or Gemini first (via shared client)
  if (process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY) {
    try {
      return await generateContentWithAI(profile, platforms, contentType, goal, extraContext, toneOverride);
    } catch (err) {
      console.error('AI (DeepSeek/Gemini) failed, trying Claude:', err);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateContentWithClaude(profile, platforms, contentType, goal, trendingHashtags, variationCount, intel, extraContext, toneOverride);
    } catch (err) {
      console.error('Anthropic failed, falling back to SerpAPI:', err);
    }
  }

  return generateSerpContent(profile, platforms, contentType, goal, trendingHashtags, variationCount, intel, extraContext, toneOverride);
}
