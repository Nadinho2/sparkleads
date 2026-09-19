import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import {
  getCampaigns,
  getQueueItems,
  getCampaignStats,
  createCampaign,
} from '@/lib/outreach-store';
import { processOutreachQueue } from '@/lib/outreach-worker';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || undefined;

  try {
    const campaigns = await getCampaigns(userToken);
    const queue = await getQueueItems(userToken, campaignId);
    const stats = await getCampaignStats(userToken, campaignId);

    return NextResponse.json({
      campaigns,
      queue,
      stats,
    });
  } catch (err: any) {
    console.error('[API sequence GET] error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    name?: string;
    steps?: Array<{
      step_number: number;
      delay_days: number;
      subject: string;
      body: string;
    }>;
    recipients?: Array<{
      email: string;
      name?: string;
      company?: string;
    }>;
    sendFirstStepImmediately?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, steps, recipients, sendFirstStepImmediately = true } = body;

  if (!name || !steps?.length || !recipients?.length) {
    return NextResponse.json(
      { error: 'name, steps, and recipients are required' },
      { status: 400 }
    );
  }

  // Validate recipients have valid email
  const validRecipients = recipients.filter(
    (r) => r.email && r.email.includes('@')
  );

  if (validRecipients.length === 0) {
    return NextResponse.json(
      { error: 'No valid recipient email addresses found' },
      { status: 400 }
    );
  }

  try {
    const created = await createCampaign(
      userToken,
      name.trim(),
      steps,
      validRecipients
    );

    let runResult = null;
    if (sendFirstStepImmediately) {
      runResult = await processOutreachQueue({
        userToken,
        campaignId: created.campaign.id,
      });
    }

    const updatedStats = await getCampaignStats(userToken, created.campaign.id);

    return NextResponse.json({
      success: true,
      campaign: created.campaign,
      steps: created.steps,
      totalEnqueued: created.queue.length,
      runResult,
      stats: updatedStats,
    });
  } catch (err: any) {
    console.error('[API sequence POST] error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
