import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export async function GET() {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_token', token)
    .single();

  if (error || !affiliate) {
    return NextResponse.json({ error: 'Affiliate record not found' }, { status: 404 });
  }

  const { data: payouts } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('user_token', token)
    .order('created_at', { ascending: false });

  const pendingPayout = (payouts || [])
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const conversionRate =
    affiliate.total_referrals > 0
      ? Math.round((affiliate.total_referrals / (affiliate.total_referrals * 3)) * 100)
      : 0;

  return NextResponse.json({
    affiliate: {
      referral_code: affiliate.referral_code,
      total_referrals: affiliate.total_referrals,
      total_earnings: Number(affiliate.total_earnings),
      pending_payout: pendingPayout,
      conversion_rate: conversionRate,
    },
    payouts: payouts || [],
  });
}
