import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// Admin endpoint to reset/set a user's credit balance
// Usage: POST /api/credits/reset { "email": "user@example.com", "balance": 100 }
// Or:   POST /api/credits/reset { "user_token": "xxx", "balance": 100 }
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { email?: string; user_token?: string; balance?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, balance } = body;
  let { user_token } = body;

  if (balance === undefined || balance === null) {
    return NextResponse.json({ error: 'Balance is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Resolve user_token from email if not provided
  if (!user_token && email) {
    const { data: activation } = await supabase
      .from('activations')
      .select('user_token')
      .eq('email', email.trim().toLowerCase())
      .eq('used', true)
      .limit(1)
      .single();

    if (!activation?.user_token) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    user_token = activation.user_token;
  }

  if (!user_token) {
    return NextResponse.json({ error: 'user_token or email is required' }, { status: 400 });
  }

  const newBalance = Number(balance);

  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_token', user_token)
    .single();

  if (existing) {
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
    amount: newBalance - Number(existing?.balance || 0),
    description: `Admin reset: balance set to ${newBalance}`,
    balance_after: newBalance,
  });

  return NextResponse.json({
    success: true,
    user_token,
    new_balance: newBalance,
  });
}
