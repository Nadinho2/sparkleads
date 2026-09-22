import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import {
  getCampaigns,
  createCampaign,
  enrollLeadsIntoCampaign,
} from '@/lib/outreach-store';
import { processOutreachQueue } from '@/lib/outreach-worker';

export const runtime = 'nodejs';

const DEFAULT_SEQUENCE_STEPS = [
  {
    step_number: 1,
    delay_days: 0,
    subject: 'Quick question about {company}',
    body: `Hi {firstName},

I came across {company} and was impressed by your work. 

I noticed your website could capture more local leads if you had an instant WhatsApp booking widget and faster mobile load times. 

We recently helped a similar business increase incoming inquiries by 40% in under 3 weeks. 

Would you be open to a quick 10-minute chat this week?

Best regards,
SparkLeads Team`,
  },
  {
    step_number: 2,
    delay_days: 3,
    subject: 'Following up regarding {company}',
    body: `Hi {firstName},

Just following up on my previous note. 

I put together 2 quick ideas that could help {company} convert more website visitors into phone and WhatsApp bookings without increasing your ad spend.

Are you available for a brief call tomorrow or Thursday?

Best,
SparkLeads Team`,
  },
  {
    step_number: 3,
    delay_days: 4,
    subject: 'Permission to close your file for {company}?',
    body: `Hi {firstName},

I know you are super busy running {company}. 

If upgrading your online presence or lead generation isn't a priority right now, no worries at all! Just let me know and I won't follow up again.

Either way, wishing you continued success!

Best regards,
SparkLeads Team`,
  },
];

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    campaignId?: string;
    campaignName?: string;
    clientId?: string;
    clientName?: string;
    recipients: Array<{
      email: string;
      name?: string;
      company?: string;
      website?: string;
      audit_score?: number | string;
      audit_issue?: string;
      client_id?: string;
      lead_id?: string;
    }>;
    sendFirstStepImmediately?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { campaignId, campaignName, clientId, clientName, recipients, sendFirstStepImmediately = true } = body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
  }

  // Filter valid email addresses
  const validRecipients = recipients.filter(
    (r) => r.email && typeof r.email === 'string' && r.email.includes('@')
  );

  if (validRecipients.length === 0) {
    return NextResponse.json(
      { error: 'None of the selected leads have valid email addresses' },
      { status: 400 }
    );
  }

  try {
    let targetCampaignId = campaignId;

    if (targetCampaignId) {
      // Enroll into existing campaign
      await enrollLeadsIntoCampaign(targetCampaignId, userToken, validRecipients, clientId);
    } else {
      // Create new sequence campaign
      const finalName = campaignName?.trim() || `Leads Campaign - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const created = await createCampaign(
        userToken,
        finalName,
        DEFAULT_SEQUENCE_STEPS,
        validRecipients,
        clientId,
        clientName
      );
      targetCampaignId = created.campaign.id;
    }

    // Automatically sync lead status to 'contacted' in the CRM leads table
    try {
      const { createSupabaseAdmin } = await import('@/lib/supabase');
      const supabase = createSupabaseAdmin();
      const leadEmails = validRecipients.map((r) => r.email.toLowerCase().trim());
      if (leadEmails.length > 0) {
        await supabase
          .from('leads')
          .update({ status: 'contacted' })
          .in('email', leadEmails);
      }
    } catch (statusSyncErr) {
      console.warn('[Enroll API] Could not batch update lead status to contacted:', statusSyncErr);
    }

    let runResult = null;
    if (sendFirstStepImmediately && targetCampaignId) {
      runResult = await processOutreachQueue({
        userToken,
        campaignId: targetCampaignId,
      });
    }

    return NextResponse.json({
      success: true,
      enrolledCount: validRecipients.length,
      campaignId: targetCampaignId,
      runResult,
    });
  } catch (err: any) {
    console.error('[API sequence enroll] error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to enroll leads in sequence' },
      { status: 500 }
    );
  }
}
