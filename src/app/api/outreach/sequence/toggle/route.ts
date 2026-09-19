import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { updateCampaignStatus } from '@/lib/outreach-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { campaignId?: string; status?: 'active' | 'paused' | 'completed' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { campaignId, status } = body;
  if (!campaignId || !status) {
    return NextResponse.json({ error: 'campaignId and status are required' }, { status: 400 });
  }

  try {
    await updateCampaignStatus(campaignId, status);
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
