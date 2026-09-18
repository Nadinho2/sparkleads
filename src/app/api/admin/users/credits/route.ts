import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    user_token?: string;
    email?: string;
    amount?: number;
    action?: 'add' | 'deduct' | 'set';
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let user_token = body.user_token || (body as any).token;
  const email = body.email;
  const amount = body.amount;
  const action = body.action || 'add';
  const reason = body.reason || (body as any).note || 'Admin adjustment';

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 });
  }

  const numAmount = Number(amount);
  const supabase = createSupabaseAdmin();

  // Find user_token by email if not provided
  if (!user_token && email) {
    const { data: act } = await supabase
      .from('activations')
      .select('user_token')
      .eq('email', email.trim().toLowerCase())
      .limit(1)
      .single();
    if (act?.user_token) {
      user_token = act.user_token;
    }
  }

  if (!user_token) {
    return NextResponse.json({ error: 'User token or valid email is required' }, { status: 400 });
  }

  const { data: existingCredit } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_token', user_token)
    .single();

  const currentBalance = existingCredit?.balance ? Number(existingCredit.balance) : 0;
  let newBalance = currentBalance;

  if (action === 'set') {
    newBalance = Math.max(0, numAmount);
  } else if (action === 'add') {
    newBalance = currentBalance + Math.max(0, numAmount);
  } else if (action === 'deduct') {
    newBalance = Math.max(0, currentBalance - Math.max(0, numAmount));
  }

  const delta = newBalance - currentBalance;

  if (existingCredit) {
    await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_token', user_token);
  } else {
    await supabase.from('user_credits').insert({
      user_token,
      balance: newBalance,
      total_purchased: 0,
    });
  }

  await supabase.from('credit_transactions').insert({
    user_token,
    type: 'admin_adjustment',
    amount: delta,
    description: `${reason} (Action: ${action}, Amount: ${numAmount})`,
    balance_after: newBalance,
  });

  await createNotification(user_token, {
    title: delta > 0 ? '💳 Tokens Added' : '💳 Tokens Adjusted',
    message: delta > 0
      ? `+${delta} tokens added to your balance: ${reason}. Current balance: ${newBalance}.`
      : `Your token balance was adjusted: ${reason}. Current balance: ${newBalance}.`,
    type: 'credit',
    link: '/dashboard/credits',
  });

  return NextResponse.json({
    success: true,
    user_token,
    previous_balance: currentBalance,
    new_balance: newBalance,
    balance: newBalance,
    delta,
  });
}
