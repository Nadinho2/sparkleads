import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { aiGenerateJSON } from '@/lib/ai-client';

export const runtime = 'nodejs';

const CREDIT_COST = 2;

interface CheckResult {
  score: number;
  label: string;
  weight: number;
  details: string;
}



export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { url?: string; businessName?: string; leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let { url } = body;
  const { businessName, leadId } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Normalize URL
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
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

  // Run all checks in parallel
  const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;

  const [pagespeedResult, siteResult] = await Promise.allSettled([
    fetch(pagespeedUrl).then((r) => r.json()),
    fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000),
    }).then((r) => r.text()),
  ]);

  const pagespeed = pagespeedResult.status === 'fulfilled' ? pagespeedResult.value : null;
  const html = siteResult.status === 'fulfilled' ? siteResult.value : '';
  const hasSSL = url.startsWith('https');

  // Build checks
  const checks: Record<string, CheckResult> = {
    performance: {
      score: Math.round(((pagespeed?.lighthouseResult?.categories?.performance?.score || 0) as number) * 100),
      label: 'Page Speed',
      weight: 20,
      details: pagespeed?.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || 'Unknown',
    },
    mobile: {
      score: pagespeed?.loadingExperience?.overall_category === 'FAST'
        ? 100
        : pagespeed?.loadingExperience?.overall_category === 'AVERAGE'
          ? 60
          : 30,
      label: 'Mobile Friendly',
      weight: 15,
      details: pagespeed?.loadingExperience?.overall_category || 'Unknown',
    },
    ssl: {
      score: hasSSL ? 100 : 0,
      label: 'SSL Certificate',
      weight: 10,
      details: hasSSL ? 'Secure (HTTPS)' : 'Not secure (HTTP)',
    },
    contactInfo: {
      score: (() => {
        const hasPhone = /(\+?[\d\s\-()]{10,})/.test(html);
        const hasWhatsApp = /whatsapp/i.test(html);
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);
        const hasContact = /contact|reach us|get in touch/i.test(html);
        const count = [hasPhone, hasWhatsApp, hasEmail, hasContact].filter(Boolean).length;
        return Math.round((count / 4) * 100);
      })(),
      label: 'Contact Information',
      weight: 15,
      details: '',
    },
    metaDescription: {
      score: /<meta[^>]*name="description"[^>]*content="[^"]{50,}"[^>]*>/i.test(html)
        ? 100
        : /<meta[^>]*name="description"[^>]*>/i.test(html)
          ? 50
          : 0,
      label: 'SEO Meta Description',
      weight: 10,
      details: '',
    },
    pageTitle: {
      score: (() => {
        const match = html.match(/<title>(.*?)<\/title>/i);
        if (!match) return 0;
        const len = match[1].length;
        return len >= 30 && len <= 60 ? 100 : len > 0 ? 60 : 0;
      })(),
      label: 'Page Title',
      weight: 10,
      details: '',
    },
    socialLinks: {
      score: (() => {
        const platforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'youtube'];
        const found = platforms.filter((p) => html.toLowerCase().includes(p)).length;
        return Math.round(Math.min((found / 3) * 100, 100));
      })(),
      label: 'Social Media Links',
      weight: 10,
      details: '',
    },
    whatsappButton: {
      score: /wa\.me|whatsapp\.com|api\.whatsapp/i.test(html) ? 100 : 0,
      label: 'WhatsApp Button',
      weight: 10,
      details: /wa\.me|whatsapp\.com/i.test(html) ? 'WhatsApp link found' : 'No WhatsApp link',
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
    const prompt = `Website audit results for ${businessName || url}:
Overall score: ${overallScore}/100
Checks: ${JSON.stringify(checks, null, 2)}

Generate 5 specific, actionable recommendations to improve this website's score.
Return a JSON array with this exact format:
[{ "priority": "high|medium|low", "title": "Short title", "description": "What to do and why", "impact": "+X points if fixed" }]
Only return the JSON array, no other text.`;

    recommendations = await aiGenerateJSON<typeof recommendations>({
      prompt,
      systemInstruction: 'You are a website optimization expert. Return ONLY valid JSON array.',
      temperature: 0.5,
      maxOutputTokens: 4096,
    });
  } catch (err) {
    console.error('AI recommendations failed:', err);
    // Provide fallback recommendations
    recommendations = [
      { priority: 'high', title: 'Improve page speed', description: 'Optimize images and reduce JavaScript for faster loading.', impact: '+10 points' },
      { priority: 'medium', title: 'Add contact information', description: 'Include phone, email, and a contact form on your website.', impact: '+8 points' },
      { priority: 'medium', title: 'Add social media links', description: 'Connect your social profiles to build trust.', impact: '+5 points' },
      { priority: 'low', title: 'Add WhatsApp button', description: 'Make it easy for customers to reach you via WhatsApp.', impact: '+5 points' },
      { priority: 'low', title: 'Improve SEO meta tags', description: 'Add a descriptive meta description and optimize your page title.', impact: '+5 points' },
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
    description: `Website grade for ${url}`,
    balance_after: newBalance,
  });

  // Save to database
  const gradeId = uuidv4();
  await supabase.from('website_grades').insert({
    id: gradeId,
    user_token: userToken,
    lead_id: leadId || null,
    url,
    business_name: businessName || null,
    overall_score: overallScore,
    breakdown: checks,
    recommendations,
    raw_data: {
      pagespeed_available: !!pagespeed,
      html_length: html.length,
    },
  });

  return NextResponse.json({
    success: true,
    gradeId,
    overallScore,
    checks,
    recommendations,
  });
}
