import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

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

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || Number(credits.balance) < 1) {
    return NextResponse.json(
      { error: 'insufficient_credits', balance: Number(credits?.balance ?? 0) },
      { status: 403 }
    );
  }

  const newBalance = Number(credits.balance) - 1;

  await supabase
    .from('user_credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_token', userToken);

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'usage',
    amount: -1,
    description: `${type === 'whatsapp' ? 'WhatsApp' : 'Email'} outreach`,
    balance_after: newBalance,
  });

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

  return NextResponse.json({ success: true, balance_after: newBalance });
}
