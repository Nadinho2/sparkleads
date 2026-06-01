import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isValidUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function firstMatch(input: string, re: RegExp): string {
  const m = input.match(re);
  return m && m[1] ? String(m[1]).trim() : '';
}

function pickFirst<T>(arr: T[] | null | undefined): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[0] ?? null;
}

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, excerpt: '' }, { status: 200 });
  }

  const url = String(body.url || '').trim();
  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ success: false, excerpt: '' }, { status: 200 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SparkLeads/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, excerpt: '' }, { status: 200 });
    }

    const html = await response.text();

    const title = firstMatch(html, /<title>(.*?)<\/title>/i);
    const description = firstMatch(
      html,
      /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
    );

    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const excerpt = cleaned.slice(0, 2000);

    const phonesRaw = cleaned.match(/(\+?[\d\s\-()]{10,})/g) || [];
    const phones = phonesRaw
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.replace(/[^\d]/g, '').length >= 10)
      .slice(0, 2);

    const emailsRaw = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

    return NextResponse.json(
      {
        success: true,
        title,
        description,
        excerpt,
        phone: pickFirst(phones),
        email: pickFirst(emailsRaw),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, excerpt: '' }, { status: 200 });
  }
}
