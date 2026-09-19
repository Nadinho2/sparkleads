import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { processOutreachQueue } from '@/lib/outreach-worker';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET_KEY;

  const isCronAuthorized =
    Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!userToken && !isCronAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processOutreachQueue({
      userToken: userToken || undefined,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error('[Process Followups Error]:', err);
    return NextResponse.json({ error: err.message || 'Worker execution failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
