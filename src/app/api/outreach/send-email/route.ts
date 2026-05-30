import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { recipients?: string[]; subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { recipients, subject, body: emailBody } = body;

  if (!recipients?.length || !subject || !emailBody) {
    return NextResponse.json(
      { error: 'recipients, subject, and body are required' },
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

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < recipients.length) {
    return NextResponse.json(
      { error: 'Insufficient credits' },
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

      for (const recipient of recipients) {
        try {
          await transporter.sendMail({
            from: `"${settings.sender_name || 'SparkLeads'}" <${settings.sender_email}>`,
            to: recipient,
            subject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
            replyTo: settings.sender_email,
          });

          sent++;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: 'sent', email: recipient, sent, failed })}\n\n`)
          );
        } catch (err) {
          failed++;
          console.error(`Failed to send to ${recipient}:`, err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: 'failed', email: recipient, sent, failed, error: 'Send failed' })}\n\n`)
          );
        }

        const newBalance = credits.balance - sent;
        await supabase
          .from('user_credits')
          .update({ balance: Math.max(0, newBalance) })
          .eq('user_token', userToken);
      }

      await supabase.from('credit_transactions').insert({
        user_token: userToken,
        type: 'usage',
        amount: -sent,
        description: `Sent ${sent} outreach emails`,
        balance_after: Math.max(0, credits.balance - sent),
      });

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: 'complete', sent, failed })}\n\n`)
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
