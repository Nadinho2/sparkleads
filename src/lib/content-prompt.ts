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

export function buildContentPrompt(
  profile: ContentProfile,
  platforms: string[],
  contentType: string,
  goal: string,
  extraContext?: string,
  toneOverride?: string
): string {
  const handles: Record<string, string | null> = {
    instagram: profile.instagram ? `@${profile.instagram}` : null,
    facebook: profile.facebook || null,
    tiktok: profile.tiktok ? `@${profile.tiktok}` : null,
    twitter: profile.twitter ? `@${profile.twitter}` : null,
    whatsapp: profile.whatsapp || profile.phone || null,
  };

  const handleLines = platforms
    .map((p) => `- ${p}: ${handles[p] || 'Not provided'}`)
    .join('\n');

  return `You are an expert social media content writer for African businesses.
Create engaging social media content for this business.

BUSINESS PROFILE:
- Name: ${profile.business_name}
- Type: ${profile.business_type}
- Location: ${profile.location || 'Nigeria'}
- Services: ${profile.services?.join(', ') || 'Not specified'}
- Tagline: ${profile.tagline || 'Not specified'}
- Unique selling point: ${profile.usp || 'Not specified'}
- Target audience: ${profile.target_audience || 'General public'}
- Brand voice: ${toneOverride || profile.brand_voice || 'friendly'}
- Website: ${profile.website || 'None'}
- Phone/WhatsApp: ${handles.whatsapp || 'Not provided'}

SOCIAL HANDLES:
${handleLines}

CONTENT REQUEST:
- Platforms: ${platforms.join(', ')}
- Content type: ${contentType}
- Goal: ${goal}
- Extra context: ${extraContext || 'None'}

RULES:
- Include relevant social media handles in captions where natural (e.g. "Follow us on Instagram: ${handles.instagram || '@businessname'}")
- Include WhatsApp/phone as CTA where appropriate: "DM us or WhatsApp ${handles.whatsapp}"
- Use language that resonates with Nigerian/African audience
- Keep captions authentic, not overly corporate
- Hashtags should be specific and discoverable
- Image/video directions should be practical and achievable with a phone camera, not requiring expensive equipment

GENERATE:
For each platform requested, create 5 unique content variations.
Each variation must be different in approach, hook, and angle.

Return ONLY valid JSON in this exact structure:

{
  "platforms": {
    "instagram": {
      "variations": [
        {
          "id": 1,
          "hook": "First line that stops the scroll",
          "caption": "Full caption with line breaks using \\n. Include emojis naturally. 3-5 sentences.",
          "hashtags": ["hashtag1", "hashtag2"],
          "hashtag_count": 8,
          "image_direction": "Describe exactly what to photograph or design",
          "video_direction": "If this works as a reel/video, describe the concept",
          "cta": "The call to action line",
          "best_time": "Best day and time to post",
          "format": "Single Image | Carousel | Reel | Story",
          "engagement_tip": "One tip to boost engagement for this post"
        }
      ]
    },
    "facebook": { "variations": [...] },
    "tiktok": { "variations": [...] },
    "twitter": { "variations": [...] },
    "whatsapp": { "variations": [...] }
  }
}

Only include platforms that were requested: ${platforms.join(', ')}`;
}
