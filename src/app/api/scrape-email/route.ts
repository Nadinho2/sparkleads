import { NextRequest, NextResponse } from 'next/server';
import { scrapeEmail } from '@/lib/scrape-email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { url } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const email = await scrapeEmail(url);
  return NextResponse.json({ email });
}
