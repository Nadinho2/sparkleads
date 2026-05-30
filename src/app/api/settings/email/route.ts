import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data } = await supabase
    .from('user_email_settings')
    .select('sender_name, sender_email, sender_password')
    .eq('user_token', userToken)
    .single();

  if (!data) {
    return NextResponse.json({
      senderName: '',
      senderEmail: '',
      hasPassword: false,
    });
  }

  return NextResponse.json({
    senderName: data.sender_name || '',
    senderEmail: data.sender_email || '',
    hasPassword: !!data.sender_password,
  });
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { senderName?: string; senderEmail?: string; senderPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { senderName, senderEmail, senderPassword } = body;

  if (!senderEmail || !senderPassword) {
    return NextResponse.json(
      { error: 'Email and App Password are required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  await supabase.from('user_email_settings').upsert(
    {
      user_token: userToken,
      sender_name: senderName || '',
      sender_email: senderEmail,
      sender_password: senderPassword,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_token' }
  );

  return NextResponse.json({ success: true });
}
