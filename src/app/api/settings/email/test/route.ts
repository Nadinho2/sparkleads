import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data: settings } = await supabase
    .from('user_email_settings')
    .select('sender_name, sender_email, sender_password')
    .eq('user_token', userToken)
    .single();

  if (!settings || !settings.sender_email || !settings.sender_password) {
    return NextResponse.json(
      { error: 'Email settings not configured' },
      { status: 400 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.sender_email,
        pass: settings.sender_password,
      },
    });

    await transporter.sendMail({
      from: `"${settings.sender_name || 'SparkLeads'}" <${settings.sender_email}>`,
      to: settings.sender_email,
      subject: 'SparkLeads — Your sender email is working ✓',
      text: 'Your email is connected to SparkLeads. Outreach emails will appear from this address.',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Invalid credentials or email service error' },
      { status: 400 }
    );
  }
}
