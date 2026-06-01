import { getJson } from 'serpapi';

export interface ContentProfile {
  id?: string;
  user_token?: string;
  lead_id?: string | null;
  business_name: string;
  business_type: string;
  location?: string | null;
  website?: string | null;
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

interface Variation {
  id: number;
  hook: string;
  caption: string;
  hashtags: string[];
  hashtag_count: number;
  image_direction: string;
  video_direction: string;
  cta: string;
  best_time: string;
  format: string;
  engagement_tip: string;
}

interface PlatformResult {
  variations: Variation[];
}

const VOICE_STYLES: Record<string, { emojis: string[]; tone: string; greeting: string }> = {
  professional: { emojis: ['📊', '✅', '📈', '💼', '🏆'], tone: 'polished and credible', greeting: '' },
  friendly: { emojis: ['😊', '💛', '🙌', '✨', '❤️'], tone: 'warm and approachable', greeting: 'Hey there!' },
  fun: { emojis: ['🎉', '🔥', '😂', '💪', '🥳'], tone: 'energetic and playful', greeting: 'Y\'all!' },
  luxury: { emojis: ['✨', '💎', '🥂', '👑', '🌟'], tone: 'premium and exclusive', greeting: '' },
  bold: { emojis: ['⚡', '🔥', '💯', '🚀', '🎯'], tone: 'confident and direct', greeting: 'Listen.' },
  educational: { emojis: ['📚', '💡', '🧠', '📝', '✅'], tone: 'informative and helpful', greeting: 'Did you know?' },
};

const CONTENT_TYPE_TEMPLATES: Record<string, {
  hooks: string[];
  angles: string[];
  formats: string[];
  imageDirections: string[];
}> = {
  'Promotional': {
    hooks: [
      '{service} lovers in {location} — this one\'s for you!',
      'We\'re making moves and you don\'t want to miss this',
      'This is your sign to treat yourself to {service}',
      'Limited time only — {business} has something special',
      'POV: You just discovered the best {type} in {location}',
    ],
    angles: ['special offer', 'limited time deal', 'new service launch', 'flash sale', 'exclusive access'],
    formats: ['Single Image', 'Carousel', 'Reel', 'Story'],
    imageDirections: [
      'Clean product/service photo with bold text overlay showing the offer',
      'Carousel showing 3-4 images of the service with prices',
      'Quick reel showing the service in action with trending audio',
      'Story with countdown sticker and swipe-up link',
    ],
  },
  'Educational': {
    hooks: [
      'Here\'s something most people don\'t know about {service}',
      'Stop making this mistake with your {type}',
      '3 things I wish I knew before starting {service}',
      'The truth about {service} that nobody talks about',
      'Let me break down {service} for you in 60 seconds',
    ],
    angles: ['tips and tricks', 'how-to guide', 'myth busting', 'beginner guide', 'pro tips'],
    formats: ['Carousel', 'Reel', 'Single Image'],
    imageDirections: [
      'Carousel with each slide showing one tip with clean graphics',
      'Talking-head video explaining the topic with text overlays',
      'Infographic style single image with 3-5 key points',
    ],
  },
  'Engagement': {
    hooks: [
      'We want to hear from you!',
      'Quick question — help us settle this',
      'Tag someone who needs to see this',
      'Which one would you pick?',
      'Drop a {emoji} if you agree',
    ],
    angles: ['poll/question', 'this or that', 'tag a friend', 'fill in the blank', 'share your experience'],
    formats: ['Single Image', 'Story', 'Reel'],
    imageDirections: [
      'Bold text question on a branded background',
      'Split image showing two options to choose from',
      'Fun meme-style image related to your industry',
    ],
  },
  'Behind the Scenes': {
    hooks: [
      'Ever wondered what goes on behind the scenes at {business}?',
      'A day in the life of {business}',
      'This is what it really takes to deliver {service}',
      'Pulling back the curtain on {type}',
      'The real story behind {business}',
    ],
    angles: ['day in the life', 'process showcase', 'team spotlight', 'workspace tour', 'preparation routine'],
    formats: ['Reel', 'Story', 'Carousel'],
    imageDirections: [
      'Casual phone video walking through your workspace',
      'Photo series showing step-by-step process',
      'Time-lapse of setting up or creating something',
    ],
  },
  'Product/Service Highlight': {
    hooks: [
      'Let us introduce you to our {service}',
      'This is what makes our {service} different',
      'You asked, we delivered — introducing {service}',
      'Our most popular {service} — here\'s why everyone loves it',
      'Spotlight on: {service}',
    ],
    angles: ['feature deep-dive', 'benefits showcase', 'comparison', 'customer favorite', 'new arrival'],
    formats: ['Carousel', 'Single Image', 'Reel'],
    imageDirections: [
      'High-quality close-up photo of the product/service result',
      'Carousel with feature breakdown on each slide',
      'Video demo showing the service in action',
    ],
  },
  'Testimonial': {
    hooks: [
      'Don\'t take our word for it — hear from our clients',
      'This message made our day',
      'When your clients are happy, we\'re happy',
      'Real results from real people',
      'Another happy customer at {business}',
    ],
    angles: ['client review', 'before/after', 'success story', 'transformation', 'recommendation'],
    formats: ['Single Image', 'Carousel', 'Reel'],
    imageDirections: [
      'Screenshot of client review/testimonial with branded frame',
      'Before/after split image showing results',
      'Video testimonial from a happy client (with permission)',
    ],
  },
  'Seasonal/Holiday': {
    hooks: [
      'Happy {holiday} from all of us at {business}!',
      'This {season}, treat yourself to {service}',
      '{holiday} special — just for you',
      'Celebrate {holiday} with {business}',
      'Season\'s greetings and a special surprise inside',
    ],
    angles: ['holiday greeting', 'seasonal offer', 'celebration', 'themed content', 'limited edition'],
    formats: ['Single Image', 'Story', 'Reel'],
    imageDirections: [
      'Themed graphic with holiday colors and your branding',
      'Festive photo of your team or workspace',
      'Holiday-themed reel with seasonal music',
    ],
  },
  'Announcement': {
    hooks: [
      'Big news from {business}!',
      'We\'ve been working on something exciting',
      'Announcement alert!',
      'You\'re the first to know',
      'Something new is coming to {business}',
    ],
    angles: ['new service', 'expansion', 'milestone', 'partnership', 'award/recognition'],
    formats: ['Single Image', 'Carousel', 'Reel'],
    imageDirections: [
      'Bold announcement graphic with key details',
      'Carousel telling the story of the announcement',
      'Video announcement from the business owner',
    ],
  },
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
  instagram: ['#instagood', '#photooftheday', '#explorepage', '#viral', '#reels', '#trending'],
  facebook: ['#smallbusiness', '#supportlocal', '#community', '#shoplocal', '#localbusiness'],
  tiktok: ['#fyp', '#foryoupage', '#viral', '#trending', '#tiktoknigeria', '#africantiktok'],
  twitter: ['#trending', '#Nigeria', '#business', '#thread', '#TwitterNG'],
  linkedin: ['#business', '#entrepreneurship', '#leadership', '#growth', '#professional'],
  whatsapp: ['#whatsapp', '#deals', '#ordernow', '#directmessage'],
};

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
        if (found) hashtags.push(...found.slice(0, 5));
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

function buildVariation(
  id: number,
  profile: ContentProfile,
  platform: string,
  contentType: string,
  goal: string,
  voice: string,
  extraContext: string | undefined,
  trendingHashtags: string[],
  angleIndex: number
): Variation {
  const template = CONTENT_TYPE_TEMPLATES[contentType] || CONTENT_TYPE_TEMPLATES['Promotional'];
  const voiceStyle = VOICE_STYLES[voice] || VOICE_STYLES['friendly'];
  const ctas = GOAL_CTAS[goal] || GOAL_CTAS['Build brand awareness'];
  const bestTimes = BEST_TIMES[platform] || BEST_TIMES['instagram'];
  const platformTags = PLATFORM_HASHTAGS[platform] || PLATFORM_HASHTAGS['instagram'];

  const businessType = profile.business_type.toLowerCase();
  const location = profile.location || 'your area';
  const name = profile.business_name;
  const service = profile.services?.[0] || businessType;
  const handles: Record<string, string | null> = {
    instagram: profile.instagram ? `@${profile.instagram}` : null,
    facebook: profile.facebook || null,
    tiktok: profile.tiktok ? `@${profile.tiktok}` : null,
    twitter: profile.twitter ? `@${profile.twitter}` : null,
  };
  const handle = handles[platform] || handles['instagram'] || `@${name.replace(/\s+/g, '').toLowerCase()}`;
  const whatsapp = profile.whatsapp || profile.phone;
  const emoji = voiceStyle.emojis[id % voiceStyle.emojis.length];

  const hookTemplate = template.hooks[angleIndex % template.hooks.length];
  const hook = hookTemplate
    .replace('{service}', service)
    .replace('{location}', location)
    .replace('{business}', name)
    .replace('{type}', businessType)
    .replace('{emoji}', emoji)
    .replace('{holiday}', 'this season')
    .replace('{season}', 'this season');

  const angle = template.angles[angleIndex % template.angles.length];
  const format = template.formats[id % template.formats.length];
  const imageDir = template.imageDirections[id % template.imageDirections.length];
  const cta = pickRandom(ctas);
  const bestTime = pickRandom(bestTimes);

  const greeting = voiceStyle.greeting ? `${voiceStyle.greeting} ` : '';
  const uspLine = profile.usp ? ` What sets us apart: ${profile.usp}.` : '';
  const serviceLine = profile.services?.length ? ` We offer: ${profile.services.slice(0, 3).join(', ')}.` : '';

  let caption = '';
  const ctaLine = whatsapp
    ? `${cta} — WhatsApp us at ${whatsapp} or DM ${handle}`
    : `${cta} — DM us ${handle}`;

  switch (platform) {
    case 'instagram':
      caption = `${greeting}${hook}\n\n${emoji} At ${name}, we're all about delivering ${voiceStyle.tone} ${service} experiences for our amazing clients in ${location}.${uspLine}${serviceLine}\n\n${extraContext ? `${extraContext}\n\n` : ''}${ctaLine}\n\n📍 ${location}${profile.website ? `\n🔗 ${profile.website}` : ''}`;
      break;
    case 'facebook':
      caption = `${greeting}${hook}\n\n${name} is your go-to ${businessType} in ${location}. We take pride in what we do and our clients love us for it.${uspLine}${serviceLine}\n\n${extraContext ? `${extraContext}\n\n` : ''}${ctaLine}\n\n📍 Location: ${location}${profile.website ? `\n🌐 ${profile.website}` : ''}${whatsapp ? `\n📱 WhatsApp: ${whatsapp}` : ''}`;
      break;
    case 'tiktok':
      caption = `${hook} ${emoji}\n\n${name} | ${location}\n\n${extraContext ? `${extraContext}\n` : ''}${ctaLine}\n\n${handle}`;
      break;
    case 'twitter':
      caption = `${hook}\n\n${name} — ${businessType} in ${location}.${uspLine ? ` ${profile.usp}.` : ''}\n\n${ctaLine}${profile.website ? `\n${profile.website}` : ''}`;
      break;
    case 'linkedin':
      caption = `${hook}\n\nAt ${name}, we are committed to providing exceptional ${service} services in ${location}.${uspLine}${serviceLine}\n\n${extraContext ? `${extraContext}\n\n` : ''}We'd love to connect with you.\n\n${profile.website || ctaLine}`;
      break;
    case 'whatsapp':
      caption = `${emoji} ${hook}\n\n${name} — ${businessType}, ${location}\n\n${serviceLine ? `${serviceLine}\n` : ''}${extraContext ? `${extraContext}\n` : ''}${cta}\n\n📱 Call/WhatsApp: ${whatsapp || profile.phone || ''}\n📍 ${location}`;
      break;
    default:
      caption = `${greeting}${hook}\n\n${name} is here for you in ${location}.${uspLine}${serviceLine}\n\n${extraContext ? `${extraContext}\n\n` : ''}${ctaLine}`;
  }

  const nicheTags = [
    `#${businessType.replace(/\s+/g, '')}`,
    `#${businessType.replace(/\s+/g, '')}${location.split(',')[0]?.replace(/\s+/g, '') || ''}`,
    '#supportlocal',
    '#smallbusiness',
  ];

  const allHashtags = Array.from(new Set([
    ...nicheTags,
    ...pickMultiple(trendingHashtags, 3),
    ...pickMultiple(platformTags, 3),
  ])).slice(0, 12);

  const engagementTips = [
    'Post when your audience is most active — check your Instagram Insights',
    'Reply to every comment within the first hour to boost engagement',
    'Use the carousel format — they get 3x more reach than single images',
    'Add a question in your caption to encourage comments',
    'Share this to your Story and tag relevant local pages',
    'Use location tags to reach local audiences',
    'Collaborate with a local influencer for more reach',
    'Pin your best comment to keep the conversation going',
  ];

  return {
    id,
    hook,
    caption,
    hashtags: allHashtags,
    hashtag_count: allHashtags.length,
    image_direction: imageDir.replace('{service}', service).replace('{business}', name),
    video_direction: format === 'Reel' ? `Short ${angle} video — ${hook.toLowerCase()}` : '',
    cta,
    best_time: bestTime,
    format,
    engagement_tip: pickRandom(engagementTips),
  };
}

export async function generateContent(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  extraContext?: string,
  toneOverride?: string
): Promise<{ platforms: Record<string, PlatformResult> }> {
  const voice = toneOverride || profile.brand_voice || 'friendly';
  const location = profile.location || 'Nigeria';
  const trendingHashtags = await fetchHashtags(profile.business_type, location);

  const result: Record<string, PlatformResult> = {};

  for (const platform of platforms) {
    const variations: Variation[] = [];
    for (let i = 0; i < 5; i++) {
      variations.push(
        buildVariation(i + 1, profile, platform, contentType, goal, voice, extraContext, trendingHashtags, i)
      );
    }
    result[platform] = { variations };
  }

  return { platforms: result };
}
