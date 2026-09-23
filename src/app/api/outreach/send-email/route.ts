import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { deductCredits } from '@/lib/credits';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    recipients?: string[];
    subject?: string;
    body?: string;
    personalizedMessages?: Array<{
      recipient: string;
      subject: string;
      body: string;
      leadName?: string;
      company?: string;
    }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const itemsToSend: Array<{
    recipient: string;
    subject: string;
    body: string;
    leadName?: string;
    company?: string;
  }> = [];

  if (body.personalizedMessages && Array.isArray(body.personalizedMessages) && body.personalizedMessages.length > 0) {
    for (const m of body.personalizedMessages) {
      if (m.recipient && m.subject && m.body) {
        itemsToSend.push(m);
      }
    }
  } else if (body.recipients && Array.isArray(body.recipients) && body.subject && body.body) {
    for (const r of body.recipients) {
      itemsToSend.push({ recipient: r, subject: body.subject, body: body.body });
    }
  }

  if (itemsToSend.length === 0) {
    return NextResponse.json(
      { error: 'Valid recipients or personalizedMessages required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: settings } = await supabase
    .from('user_email_settings')
    .select('sender_name, sender_email, sender_password')
    .eq('user_token', userToken)
    .single();

  if (!settings || !settings.sender_email || !settings.sender_password) {
    return NextResponse.json(
      { error: 'no_sender_email', message: 'Please set up your sender email in Settings first' },
      { status: 400 }
    );
  }

  // Check and deduct credits upfront
  const creditResult = await deductCredits(
    userToken,
    itemsToSend.length,
    `Sent ${itemsToSend.length} personalized outreach emails`
  );
  if (!creditResult.success) {
    return NextResponse.json(
      { error: creditResult.error || 'Insufficient credits' },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: settings.sender_email,
      pass: settings.sender_password,
    },
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let sent = 0;
      let failed = 0;

      for (const item of itemsToSend) {
        try {
          await transporter.sendMail({
            from: `"${settings.sender_name || 'SparkLeads'}" <${settings.sender_email}>`,
            to: item.recipient,
            subject: item.subject,
            text: item.body,
            html: item.body.replace(/\n/g, '<br>'),
            replyTo: settings.sender_email,
          });

          sent++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: 'sent',
                email: item.recipient,
                leadName: item.leadName || '',
                company: item.company || '',
                subject: item.subject,
                sent,
                failed,
                total: itemsToSend.length,
              })}\n\n`
            )
          );
        } catch (err) {
          failed++;
          console.error(`Failed to send to ${item.recipient}:`, err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: 'failed',
                email: item.recipient,
                leadName: item.leadName || '',
                company: item.company || '',
                sent,
                failed,
                total: itemsToSend.length,
                error: 'Send failed',
              })}\n\n`
            )
          );
        }
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: 'complete', sent, failed, total: itemsToSend.length })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
