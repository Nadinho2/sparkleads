import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { updateQueueItem } from '@/lib/outreach-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { queueId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { queueId } = body;
  if (!queueId) {
    return NextResponse.json({ error: 'queueId is required' }, { status: 400 });
  }

  try {
    await updateQueueItem(queueId, { status: 'replied' });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
