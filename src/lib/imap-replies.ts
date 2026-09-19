import { ImapFlow } from 'imapflow';
import { createSupabaseAdmin } from './supabase';

export interface ImapRepliesResult {
  repliedEmails: Set<string>;
  inReplyToIds: Set<string>;
  replyDetails: Array<{
    from: string;
    subject: string;
    date: Date;
    inReplyTo?: string;
    bodySnippet?: string;
  }>;
}

function extractCleanText(raw: string): string {
  if (!raw) return '';
  const bodySplit = raw.split(/\r?\n\r?\n/);
  const body = bodySplit.slice(1).join('\n');
  return body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500);
}

/**
 * Connects to Gmail IMAP using user's configured email credentials,
 * scans INBOX for recent messages, and returns a list of sender emails
 * and inReplyTo headers.
 */
export async function checkInboxReplies(
  userToken: string,
  sinceDate?: Date
): Promise<ImapRepliesResult> {
  const result: ImapRepliesResult = {
    repliedEmails: new Set<string>(),
    inReplyToIds: new Set<string>(),
    replyDetails: [],
  };

  const supabase = createSupabaseAdmin();
  const { data: settings, error: settingsError } = await supabase
    .from('user_email_settings')
    .select('sender_email, sender_password')
    .eq('user_token', userToken)
    .single();

  if (settingsError || !settings?.sender_email || !settings?.sender_password) {
    console.warn('[IMAP] No email credentials found for user_token:', userToken);
    return result;
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: settings.sender_email.trim(),
      pass: settings.sender_password.replace(/\s+/g, ''),
    },
    logger: false,
    emitLogs: false,
  });

  // Default to checking the last 14 days if not specified
  const searchSince = sinceDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    try {
      const messageUids = await client.search({ since: searchSince });
      if (messageUids && messageUids.length > 0) {
        // Inspect latest 50 messages with source to extract reply snippets
        const targetUids = messageUids.slice(-50);
        for await (const msg of client.fetch(targetUids, { envelope: true, source: true })) {
          if (!msg.envelope) continue;
          const envelope = msg.envelope;
          const fromAddresses = envelope.from || [];
          const rawSource = msg.source ? msg.source.toString('utf8') : '';
          const bodySnippet = extractCleanText(rawSource);

          for (const sender of fromAddresses) {
            if (sender.address) {
              const lowerEmail = sender.address.toLowerCase().trim();
              // Exclude the user's own email address
              if (lowerEmail !== settings.sender_email.toLowerCase().trim()) {
                result.repliedEmails.add(lowerEmail);
                result.replyDetails.push({
                  from: lowerEmail,
                  subject: envelope.subject || '',
                  date: envelope.date ? new Date(envelope.date) : new Date(),
                  inReplyTo: envelope.inReplyTo,
                  bodySnippet,
                });
              }
            }
          }

          if (envelope.inReplyTo) {
            result.inReplyToIds.add(envelope.inReplyTo.trim());
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err: any) {
    console.error('[IMAP] Error checking replies:', err?.message || err);
  }

  return result;
}
