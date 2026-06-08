import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { deductCredits } from '@/lib/credits';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { lead_id?: string; type?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { lead_id, type, message } = body;
  if (!lead_id || !type || !message) {
    return NextResponse.json({ error: 'lead_id, type, and message are required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check & deduct credits
  const deduction = await deductCredits(userToken, 1, `${type === 'whatsapp' ? 'WhatsApp' : 'Email'} outreach`);
  if (!deduction.success) {
    return NextResponse.json(
      { error: deduction.error, required: deduction.required, balance: deduction.balance },
      { status: 403 }
    );
  }

  await supabase.from('outreach_messages').insert({
    user_token: userToken,
    lead_id,
    type,
    message,
    status: 'sent',
  });

  await supabase
    .from('leads')
    .update({ status: 'contacted' })
    .eq('id', lead_id);

  return NextResponse.json({ success: true });
}
