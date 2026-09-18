import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';
  const filter = searchParams.get('filter') || 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const supabase = createSupabaseAdmin();

  try {
    let query = supabase
      .from('activations')
      .select('id, email, token, user_token, used, affiliate_ref, created_at', { count: 'exact' });

    if (q) {
      query = query.or(`email.ilike.%${q}%,user_token.ilike.%${q}%`);
    }

    if (filter === 'used') {
      query = query.eq('used', true);
    } else if (filter === 'unused') {
      query = query.eq('used', false);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: users, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userTokens = (users || []).map((u) => u.user_token).filter(Boolean);

    // Fetch balances, affiliates, and workspaces for these tokens
    const [creditsRes, affiliatesRes, workspacesRes] = await Promise.all([
      userTokens.length > 0
        ? supabase.from('user_credits').select('user_token, balance, total_purchased').in('user_token', userTokens)
        : { data: [] },
      userTokens.length > 0
        ? supabase.from('affiliates').select('user_token, referral_code, total_referrals, total_earnings').in('user_token', userTokens)
        : { data: [] },
      userTokens.length > 0
        ? supabase.from('workspaces').select('id, name, owner_token, plan, status').in('owner_token', userTokens)
        : { data: [] },
    ]);

    const creditsMap = new Map((creditsRes.data || []).map((c) => [c.user_token, c]));
    const affiliatesMap = new Map((affiliatesRes.data || []).map((a) => [a.user_token, a]));
    const workspacesMap = new Map((workspacesRes.data || []).map((w) => [w.owner_token, w]));

    const enrichedUsers = (users || []).map((user) => {
      const credit = creditsMap.get(user.user_token);
      const affiliate = affiliatesMap.get(user.user_token);
      const workspace = workspacesMap.get(user.user_token);

      return {
        id: user.id,
        email: user.email,
        userToken: user.user_token,
        token: user.token,
        used: user.used,
        affiliateRef: user.affiliate_ref,
        createdAt: user.created_at,
        creditBalance: credit?.balance ?? 0,
        totalPurchased: credit?.total_purchased ?? 0,
        referralCode: affiliate?.referral_code ?? null,
        totalReferrals: affiliate?.total_referrals ?? 0,
        totalEarnings: affiliate?.total_earnings ?? 0,
        agency: workspace
          ? {
              id: workspace.id,
              name: workspace.name,
              plan: workspace.plan,
              status: workspace.status,
            }
          : null,
      };
    });

    const agencyFilter = searchParams.get('agencyFilter');
    let finalUsers = enrichedUsers;
    if (agencyFilter === 'agency_only') {
      finalUsers = enrichedUsers.filter((u) => !!u.agency);
    } else if (agencyFilter === 'independent_only') {
      finalUsers = enrichedUsers.filter((u) => !u.agency);
    }

    return NextResponse.json({
      success: true,
      users: finalUsers,
      pagination: {
        page,
        limit,
        total: agencyFilter && agencyFilter !== 'all' ? finalUsers.length : (count || 0),
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
