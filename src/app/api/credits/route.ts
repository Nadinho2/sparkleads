import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();

  if (!userToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const workspaceId = getWorkspaceId();

  // Agency workspace path
  if (workspaceId) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credits_remaining, plan')
      .eq('id', workspaceId)
      .single();

    // Get workspace activity as transaction history
    const { data: activity } = await supabase
      .from('workspace_activity')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Also get credit_transactions for this user (from individual path)
    const { data: userTx } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_token', userToken)
      .order('created_at', { ascending: false })
      .limit(50);

    // Map workspace_activity to transaction format
    const wsTransactions = (activity || []).map((a) => ({
      id: a.id,
      type: a.action === 'credit_used' ? 'usage' : a.action === 'credit_added' ? 'purchase' : a.action === 'credit_transferred' ? 'transfer' : 'info',
      amount: a.metadata?.amount || a.metadata?.credits || 0,
      description: a.metadata?.description || a.action,
      balance_after: 0,
      created_at: a.created_at,
      member_name: a.member_name,
    }));

    // Merge and sort
    const allTransactions = [...wsTransactions, ...(userTx || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    return NextResponse.json({
      balance: Number(workspace?.credits_remaining || 0),
      total_purchased: 0,
      plan: workspace?.plan || null,
      is_workspace: true,
      transactions: allTransactions,
    });
  }

  // Individual path
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance, total_purchased')
    .eq('user_token', userToken)
    .single();

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    balance: Number(credits?.balance || 0),
    total_purchased: Number(credits?.total_purchased || 0),
    is_workspace: false,
    transactions: transactions || [],
  });
}
