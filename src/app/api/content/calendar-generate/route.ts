import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { generateContent } from '@/lib/content-prompt';
import type { ContentProfile } from '@/lib/content-prompt';

export const runtime = 'nodejs';

const WEEKLY_CONTENT_MIX = [
  'Promotional',
  'Educational',
  'Engagement',
  'Behind the Scenes',
  'Product/Service Highlight',
  'Testimonial',
  'Seasonal/Holiday',
  'Announcement',
];

const BEST_POST_TIMES: Record<string, string[]> = {
  instagram: ['19:00', '12:00', '20:00', '18:00', '13:00', '11:00'],
  facebook: ['15:00', '10:00', '13:00', '16:00', '09:00', '14:00'],
  tiktok: ['20:00', '19:00', '21:00', '18:00', '22:00', '17:00'],
  twitter: ['12:00', '09:00', '13:00', '10:00', '15:00', '11:00'],
  linkedin: ['08:00', '12:00', '17:00', '07:30', '10:00', '16:00'],
  whatsapp: ['10:00', '14:00', '09:00', '11:00', '15:00', '13:00'],
};

function getMonthSchedule(year: number, month: number, postsPerWeek: number): { date: string; dayOfWeek: number }[] {
  const schedule: { date: string; dayOfWeek: number }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  const preferredDays = postsPerWeek <= 2
    ? [1, 4]
    : postsPerWeek <= 3
    ? [1, 3, 5]
    : [0, 1, 3, 5];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    if (preferredDays.includes(dow)) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      schedule.push({ date: dateStr, dayOfWeek: dow });
    }
  }

  return schedule;
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { profile_id, platforms, goal, posts_per_week, month, tone_override, extra_context } = body;

  if (!profile_id || !platforms?.length || !goal) {
    return NextResponse.json({ error: 'Missing required fields: profile_id, platforms, goal' }, { status: 400 });
  }

  const ppw = Math.min(Math.max(Number(posts_per_week) || 3, 2), 6);
  const totalPosts = ppw * 4;

  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);

  const schedule = getMonthSchedule(year, monthNum, ppw);
  const postsToGenerate = schedule.slice(0, totalPosts);

  const creditCost = totalPosts * platforms.length;

  const supabase = createSupabaseAdmin();

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || Number(credits.balance) < creditCost) {
    return NextResponse.json({ error: 'insufficient_credits', required: creditCost, available: credits?.balance || 0 }, { status: 402 });
  }

  const { data: profile } = await supabase
    .from('content_profiles')
    .select('*')
    .eq('id', profile_id)
    .eq('user_token', userToken)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const generatedPosts: {
    date: string;
    time: string;
    platform: string;
    contentType: string;
    variation: {
      id: number;
      hook: string;
      caption: string;
      hashtags: string[];
      image_direction: string;
      video_direction: string;
      cta: string;
      best_time: string;
      format: string;
      engagement_tip: string;
    };
  }[] = [];

  const errors: string[] = [];

  for (let i = 0; i < postsToGenerate.length; i++) {
    const scheduleItem = postsToGenerate[i];
    const contentType = WEEKLY_CONTENT_MIX[i % WEEKLY_CONTENT_MIX.length];
    const platformTimes = platforms.map((p: string) => ({
      platform: p,
      time: (BEST_POST_TIMES[p] || BEST_POST_TIMES['instagram'])[i % 6],
    }));

    try {
      const result = await generateContent(
        profile as ContentProfile,
        platforms,
        contentType,
        goal,
        extra_context,
        tone_override,
        1
      );

      for (const pt of platformTimes) {
        const platformResult = result.platforms[pt.platform];
        if (platformResult?.variations?.length > 0) {
          generatedPosts.push({
            date: scheduleItem.date,
            time: pt.time,
            platform: pt.platform,
            contentType,
            variation: platformResult.variations[0],
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Week ${Math.floor(i / ppw) + 1}, ${contentType}: ${msg}`);
    }
  }

  if (generatedPosts.length === 0) {
    return NextResponse.json({ error: 'Failed to generate any content', details: errors.join('; ') }, { status: 500 });
  }

  const savedContentIds: string[] = [];
  const calendarEvents: Record<string, unknown>[] = [];

  for (const post of generatedPosts) {
    const { data: savedContent } = await supabase
      .from('generated_content')
      .insert({
        user_token: userToken,
        profile_id,
        platforms: { [post.platform]: { variations: [post.variation] } },
        content_type: post.contentType,
        goal,
        variation_count: 1,
        credits_used: 1,
      })
      .select('id')
      .single();

    if (savedContent) {
      savedContentIds.push(savedContent.id);
    }

    const { data: calEvent } = await supabase
      .from('content_calendar')
      .insert({
        user_token: userToken,
        profile_id,
        content_id: savedContent?.id || null,
        platform: post.platform,
        scheduled_date: post.date,
        scheduled_time: post.time,
        caption: post.variation.caption,
        hashtags: post.variation.hashtags,
        image_direction: post.variation.image_direction,
        status: 'scheduled',
      })
      .select()
      .single();

    if (calEvent) {
      calendarEvents.push(calEvent);
    }
  }

  return NextResponse.json({
    success: true,
    month: targetMonth,
    total_posts: generatedPosts.length,
    platforms,
    posts_per_week: ppw,
    credits_used: creditCost,
    events: calendarEvents,
    posts: generatedPosts.map((p) => ({
      date: p.date,
      time: p.time,
      platform: p.platform,
      content_type: p.contentType,
      hook: p.variation.hook,
      caption: p.variation.caption.slice(0, 100) + '...',
      format: p.variation.format,
    })),
    errors: errors.length > 0 ? errors : undefined,
  });
}
