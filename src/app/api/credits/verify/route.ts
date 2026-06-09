import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

const CREDIT_PACKS: Record<string, { credits: number }> = {
  starter: { credits: 50 },
  growth: { credits: 150 },
  pro: { credits: 500 },
  mega: { credits: 1000 },
};

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
  }

  let body: { reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { reference } = body;
  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    // Paystack may return metadata as string or object
    let metadata = paystackData.data.metadata;
    if (typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata); } catch { metadata = {}; }
    }

    console.log('Credit verify — Paystack metadata:', JSON.stringify(metadata));

    // Extract user_token and credits from metadata
    const userToken = metadata?.user_token || metadata?.user_token?.toString();
    const packKey = metadata?.pack || '';
    const creditsFromMeta = metadata?.credits ? Number(metadata.credits) : 0;
    const creditsFromPack = CREDIT_PACKS[packKey]?.credits || 0;
    const credits = creditsFromMeta || creditsFromPack;

    // Also try extracting from reference pattern: credits_<uuid>_<timestamp>
    // Fall back to looking up by email if metadata is missing
    let resolvedUserToken = userToken;
    let resolvedCredits = credits;

    if (!resolvedUserToken || !resolvedCredits) {
      console.log('Credit verify — metadata incomplete, trying email lookup');
      const customerEmail = paystackData.data.customer?.email?.toLowerCase();
      if (customerEmail) {
        const supabase = createSupabaseAdmin();
        const { data: activation } = await supabase
          .from('activations')
          .select('user_token')
          .eq('email', customerEmail)
          .eq('used', true)
          .limit(1)
          .single();

        if (activation?.user_token) {
          resolvedUserToken = activation.user_token;
        }
      }

      // If still no credits, default to the amount paid divided by a reasonable rate
      if (!resolvedCredits) {
        const amountPaid = paystackData.data.amount; // in kobo
        // Determine credits from amount
        if (amountPaid >= 5970000) resolvedCredits = 1000;
        else if (amountPaid >= 3320000) resolvedCredits = 500;
        else if (amountPaid >= 1330000) resolvedCredits = 150;
        else if (amountPaid >= 660000) resolvedCredits = 50;
        else resolvedCredits = 50; // minimum
      }
    }

    if (!resolvedUserToken) {
      console.error('Credit verify — could not determine user token');
      return NextResponse.json({ success: false, error: 'Could not identify user' }, { status: 400 });
    }

    if (!resolvedCredits) {
      return NextResponse.json({ success: false, error: 'Could not determine credits' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const workspaceId = getWorkspaceId();

    // Agency workspace path
    if (workspaceId) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('credits_remaining')
        .eq('id', workspaceId)
        .single();

      if (!workspace) {
        return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 400 });
      }

      const newBalance = Number(workspace.credits_remaining) + resolvedCredits;
      await supabase
        .from('workspaces')
        .update({ credits_remaining: newBalance })
        .eq('id', workspaceId);

      await supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        user_token: resolvedUserToken,
        member_name: 'System',
        action: 'credit_added',
        resource_type: 'credit',
        metadata: { amount: resolvedCredits, description: `Purchased ${resolvedCredits} credits via Paystack` },
      });

      return NextResponse.json({
        success: true,
        balance: newBalance,
        credits_added: resolvedCredits,
      });
    }

    // Individual path
    const { data: existing } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_token', resolvedUserToken)
      .single();

    const currentBalance = Number(existing?.balance || 0);
    const currentPurchased = Number(existing?.total_purchased || 0);
    const newBalance = currentBalance + resolvedCredits;
    const newTotalPurchased = currentPurchased + resolvedCredits;

    console.log(`Credit verify — adding ${resolvedCredits} credits. Balance: ${currentBalance} → ${newBalance}`);

    if (existing) {
      await supabase
        .from('user_credits')
        .update({
          balance: newBalance,
          total_purchased: newTotalPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq('user_token', resolvedUserToken);
    } else {
      await supabase.from('user_credits').insert({
        user_token: resolvedUserToken,
        balance: newBalance,
        total_purchased: newTotalPurchased,
      });
    }

    await supabase.from('credit_transactions').insert({
      user_token: resolvedUserToken,
      type: 'purchase',
      amount: resolvedCredits,
      description: `Purchased ${resolvedCredits} credits via Paystack`,
      balance_after: newBalance,
    });

    return NextResponse.json({
      success: true,
      balance: newBalance,
      credits_added: resolvedCredits,
    });
  } catch (error) {
    console.error('Credit verify error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
