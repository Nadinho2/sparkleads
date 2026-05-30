import { NextResponse } from 'next/server';
import { scrapeEmail } from '@/lib/scrape-email';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || 'https://example.com';

  try {
    const email = await scrapeEmail(url);
    return NextResponse.json({ success: true, url, email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message });
  }
}
