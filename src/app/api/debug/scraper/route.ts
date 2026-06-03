import { NextRequest, NextResponse } from 'next/server';
import { scrapeEmail } from '@/lib/scrape-email';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
