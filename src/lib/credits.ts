import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

/**
 * Deduct credits from the appropriate pool.
 * 
 * If the user is part of an agency workspace:
 *   - Deducts from workspace.credits_remaining
 *   - Increments workspace_member.credits_used
 *   - Logs to workspace_activity
 * 
 * If the user is an individual:
 *   - Deducts from user_credits.balance
 *   - Inserts into credit_transactions
 * 
 * Returns { success: true } or { error: string, required?: number, balance?: number }
 */
export async function deductCredits(
  userToken: string,
  amount: number,
  description: string
): Promise<{
  success: boolean;
  error?: string;
  required?: number;
  balance?: number;
}> {
  const supabase = createSupabaseAdmin();
  const workspaceId = getWorkspaceId();

  if (workspaceId) {
    // ── Agency workspace path ──
    // Check workspace credit pool
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credits_remaining')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return { success: false, error: 'Workspace not found', required: amount, balance: 0 };
    }

    if (workspace.credits_remaining < amount) {
      return {
        success: false,
        error: 'Insufficient workspace credits',
        required: amount,
        balance: workspace.credits_remaining,
      };
    }

    // Check member's individual credit limit
    const { data: member } = await supabase
      .from('workspace_members')
      .select('credit_limit, credits_used, name')
      .eq('user_token', userToken)
      .eq('workspace_id', workspaceId)
      .single();

    if (!member) {
      return { success: false, error: 'Workspace member not found', required: amount, balance: 0 };
    }

    // If member has a per-member credit limit (>= 0), check it. -1 means unlimited.
    if (member.credit_limit >= 0 && member.credits_used + amount > member.credit_limit) {
      return {
        success: false,
        error: 'Your personal credit limit for this month has been reached',
        required: amount,
        balance: member.credit_limit - member.credits_used,
      };
    }

    // Deduct from workspace pool
    const { error: wsError } = await supabase
      .from('workspaces')
      .update({ credits_remaining: workspace.credits_remaining - amount })
      .eq('id', workspaceId);

    if (wsError) {
      return { success: false, error: 'Failed to deduct workspace credits', required: amount, balance: workspace.credits_remaining };
    }

    // Increment member's used credits
    await supabase
      .from('workspace_members')
      .update({ credits_used: member.credits_used + amount })
      .eq('user_token', userToken)
      .eq('workspace_id', workspaceId);

    // Log activity
    await supabase.from('workspace_activity').insert({
      workspace_id: workspaceId,
      user_token: userToken,
      member_name: member.name || 'Team Member',
      action: 'credit_used',
      resource_type: 'credit',
      metadata: { amount, description },
    });

    return { success: true };
  }

  // ── Individual path ──
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < amount) {
    return {
      success: false,
      error: 'Insufficient credits',
      required: amount,
      balance: credits?.balance ?? 0,
    };
  }

  const newBalance = credits.balance - amount;
  await supabase
    .from('user_credits')
    .update({ balance: newBalance })
    .eq('user_token', userToken);

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'usage',
    amount: -amount,
    description,
    balance_after: newBalance,
  });

  return { success: true };
}

/**
 * Get the user's credit balance, checking workspace or individual pool.
 */
export async function getCreditBalance(userToken: string): Promise<{
  balance: number;
  type: 'workspace' | 'individual';
  limit?: number;
  used?: number;
}> {
  const supabase = createSupabaseAdmin();
  const workspaceId = getWorkspaceId();

  if (workspaceId) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credits_remaining')
      .eq('id', workspaceId)
      .single();

    const { data: member } = await supabase
      .from('workspace_members')
      .select('credit_limit, credits_used')
      .eq('user_token', userToken)
      .eq('workspace_id', workspaceId)
      .single();

    return {
      balance: workspace?.credits_remaining ?? 0,
      type: 'workspace',
      limit: member?.credit_limit || 0,
      used: member?.credits_used || 0,
    };
  }

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  return {
    balance: credits?.balance ?? 0,
    type: 'individual',
  };
}
