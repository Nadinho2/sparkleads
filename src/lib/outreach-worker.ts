import nodemailer from 'nodemailer';
import { createSupabaseAdmin } from './supabase';
import { checkInboxReplies } from './imap-replies';
import {
  getCampaignById,
  getDueQueueItems,
  getQueueItems,
  updateQueueItem,
} from './outreach-store';
import { OutreachQueueItem, OutreachSequenceStep } from '@/types';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function interpolate(template: string, item: OutreachQueueItem): string {
  const name = item.recipient_name || 'there';
  const firstName = item.recipient_name ? item.recipient_name.split(' ')[0] : 'there';
  const company = item.company_name || 'your company';

  return template
    .replace(/\{name\}/gi, name)
    .replace(/\{firstName\}/gi, firstName)
    .replace(/\{company\}/gi, company)
    .replace(/\{email\}/gi, item.recipient_email);
}

/**
 * Checks IMAP inbox for any prospect replies and marks matching queue items as 'replied'.
 */
export async function detectAndMarkReplies(userToken: string): Promise<number> {
  const imapResult = await checkInboxReplies(userToken);
  const { repliedEmails, inReplyToIds } = imapResult;

  if (repliedEmails.size === 0 && inReplyToIds.size === 0) {
    return 0;
  }

  const queueItems = await getQueueItems(userToken);
  let newlyReplied = 0;

  for (const item of queueItems) {
    if (item.status === 'replied') continue;

    const emailMatch = repliedEmails.has(item.recipient_email.toLowerCase());
    const originalMsgMatch =
      item.original_message_id && inReplyToIds.has(item.original_message_id.trim());
    const lastMsgMatch =
      item.last_message_id && inReplyToIds.has(item.last_message_id.trim());

    if (emailMatch || originalMsgMatch || lastMsgMatch) {
      await updateQueueItem(item.id, {
        status: 'replied',
      });
      newlyReplied++;
      console.log(`[Follow-up Engine] Marked prospect ${item.recipient_email} as REPLIED! Follow-ups stopped.`);
    }
  }

  return newlyReplied;
}

export interface ProcessRunResult {
  processed: number;
  sent: number;
  failed: number;
  repliedDetected: number;
  details: Array<{
    email: string;
    step: number;
    status: 'sent' | 'failed' | 'replied' | 'skipped';
    error?: string;
  }>;
}

/**
 * Runs the follow-up worker:
 * 1. Checks IMAP for replies and stops follow-ups for prospects that replied.
 * 2. Fetches queue items due for the next step.
 * 3. Sends threaded follow-up emails via Gmail SMTP with In-Reply-To headers.
 * 4. Schedules next step or completes sequence.
 */
export async function processOutreachQueue(options?: {
  userToken?: string;
  campaignId?: string;
  maxBatch?: number;
}): Promise<ProcessRunResult> {
  const maxBatch = options?.maxBatch || 25;
  const result: ProcessRunResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    repliedDetected: 0,
    details: [],
  };

  // Step 1: Detect replies for user
  if (options?.userToken) {
    result.repliedDetected = await detectAndMarkReplies(options.userToken);
  }

  // Step 2: Fetch due items
  const dueItems = await getDueQueueItems(options?.userToken);
  const targetItems = options?.campaignId
    ? dueItems.filter((i) => i.campaign_id === options.campaignId)
    : dueItems;

  const batch = targetItems.slice(0, maxBatch);
  const supabase = createSupabaseAdmin();

  for (const item of batch) {
    result.processed++;

    // Safety check: ensure recipient hasn't replied
    if (item.status === 'replied') {
      result.details.push({ email: item.recipient_email, step: item.current_step, status: 'replied' });
      continue;
    }

    // Fetch user email credentials
    const { data: settings } = await supabase
      .from('user_email_settings')
      .select('sender_name, sender_email, sender_password')
      .eq('user_token', item.user_token)
      .single();

    if (!settings?.sender_email || !settings?.sender_password) {
      const err = 'No sender email settings found';
      await updateQueueItem(item.id, { status: 'failed', error_message: err });
      result.failed++;
      result.details.push({ email: item.recipient_email, step: item.current_step, status: 'failed', error: err });
      continue;
    }

    // Fetch campaign steps
    const campaignData = await getCampaignById(item.campaign_id);
    if (!campaignData || campaignData.campaign.status === 'paused') {
      result.details.push({ email: item.recipient_email, step: item.current_step, status: 'skipped' });
      continue;
    }

    const currentStepDef = campaignData.steps.find((s) => s.step_number === item.current_step);
    if (!currentStepDef) {
      // No current step found, mark as completed
      await updateQueueItem(item.id, { status: 'completed' });
      result.details.push({ email: item.recipient_email, step: item.current_step, status: 'skipped' });
      continue;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.sender_email.trim(),
        pass: settings.sender_password.replace(/\s+/g, ''),
      },
    });

    const subject = interpolate(currentStepDef.subject, item);
    const textBody = interpolate(currentStepDef.body, item);
    const htmlBody = textBody.replace(/\n/g, '<br>');

    // Threading setup for follow-ups (step > 1)
    let emailSubject = subject;
    const mailOptions: any = {
      from: `"${settings.sender_name || 'SparkLeads'}" <${settings.sender_email}>`,
      to: item.recipient_email,
      subject: emailSubject,
      text: textBody,
      html: htmlBody,
      replyTo: settings.sender_email,
    };

    if (item.current_step > 1 && item.original_message_id) {
      // Thread follow-up onto original thread
      if (!emailSubject.toLowerCase().startsWith('re:')) {
        emailSubject = `Re: ${emailSubject}`;
      }
      mailOptions.subject = emailSubject;
      mailOptions.inReplyTo = item.original_message_id;
      mailOptions.references = [item.original_message_id];
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      const messageId = info.messageId;
      const now = new Date();

      // Check if there is a subsequent step in the sequence
      const nextStepDef = campaignData.steps.find(
        (s) => s.step_number === item.current_step + 1
      );

      if (nextStepDef) {
        // Schedule next step with delay_days
        const nextRun = new Date(now.getTime() + nextStepDef.delay_days * 24 * 60 * 60 * 1000);
        await updateQueueItem(item.id, {
          status: 'scheduled',
          current_step: item.current_step + 1,
          last_sent_at: now.toISOString(),
          next_run_at: nextRun.toISOString(),
          original_message_id: item.original_message_id || messageId,
          last_message_id: messageId,
          error_message: null,
        });
      } else {
        // Sequence completed!
        await updateQueueItem(item.id, {
          status: 'completed',
          last_sent_at: now.toISOString(),
          original_message_id: item.original_message_id || messageId,
          last_message_id: messageId,
          error_message: null,
        });
      }

      result.sent++;
      result.details.push({ email: item.recipient_email, step: item.current_step, status: 'sent' });

      // Anti-spam jitter delay (1.5s - 2.5s)
      await sleep(1500 + Math.random() * 1000);
    } catch (sendErr: any) {
      console.error(`[Follow-up Engine] Send failed to ${item.recipient_email}:`, sendErr);
      const errMsg = sendErr?.message || 'Send failed';
      await updateQueueItem(item.id, {
        status: 'failed',
        error_message: errMsg,
      });
      result.failed++;
      result.details.push({
        email: item.recipient_email,
        step: item.current_step,
        status: 'failed',
        error: errMsg,
      });
    }
  }

  return result;
}
