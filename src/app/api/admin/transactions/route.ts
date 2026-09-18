import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));

  const supabase = createSupabaseAdmin();

  try {
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userTokens = Array.from(new Set((transactions || []).map((t) => t.user_token).filter(Boolean)));

    let userEmailsMap = new Map<string, string>();
    if (userTokens.length > 0) {
      const { data: users } = await supabase
        .from('activations')
        .select('user_token, email')
        .in('user_token', userTokens);

      userEmailsMap = new Map((users || []).map((u) => [u.user_token, u.email]));
    }

    const enriched = (transactions || []).map((t) => ({
      id: t.id,
      userToken: t.user_token,
      userEmail: userEmailsMap.get(t.user_token) || 'Unknown',
      type: t.type,
      amount: t.amount,
      description: t.description,
      balanceAfter: t.balance_after,
      createdAt: t.created_at,
    }));

    return NextResponse.json({ success: true, transactions: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
