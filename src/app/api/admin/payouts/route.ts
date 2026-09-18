import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';

  const supabase = createSupabaseAdmin();

  try {
    let query = supabase
      .from('payout_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payouts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userTokens = Array.from(new Set((payouts || []).map((p) => p.user_token).filter(Boolean)));
    let emailsMap = new Map<string, string>();
    if (userTokens.length > 0) {
      const { data: users } = await supabase
        .from('activations')
        .select('user_token, email')
        .in('user_token', userTokens);

      emailsMap = new Map((users || []).map((u) => [u.user_token, u.email]));
    }

    const enriched = (payouts || []).map((p) => ({
      id: p.id,
      userToken: p.user_token,
      userEmail: emailsMap.get(p.user_token) || 'Unknown',
      amount: p.amount,
      bankName: p.bank_name,
      accountNumber: p.account_number,
      accountName: p.account_name,
      status: p.status,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ success: true, payouts: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { payout_id?: string; status?: 'pending' | 'processing' | 'completed' | 'rejected' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { payout_id, status } = body;

  if (!payout_id || !status) {
    return NextResponse.json({ error: 'payout_id and status are required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('payout_requests')
    .update({ status })
    .eq('id', payout_id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.user_token) {
    const isCompleted = status === 'completed';
    const isRejected = status === 'rejected';
    await createNotification(data.user_token, {
      title: isCompleted ? '💸 Payout Sent to Bank!' : isRejected ? '⚠️ Payout Request Rejected' : 'Payout Status Updated',
      message: isCompleted
        ? `Your payout of ₦${Number(data.amount).toLocaleString()} has been approved and transferred to your bank account (${data.bank_name} - ${data.account_number}).`
        : isRejected
        ? `Your payout request of ₦${Number(data.amount).toLocaleString()} could not be processed. Please check your bank details or contact support.`
        : `Your payout request of ₦${Number(data.amount).toLocaleString()} status is now: ${status}.`,
      type: 'payout',
      link: '/dashboard/affiliate',
    });
  }

  return NextResponse.json({ success: true, payout: data });
}
