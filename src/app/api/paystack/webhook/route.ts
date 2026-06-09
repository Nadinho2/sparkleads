import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  const signature = request.headers.get('x-paystack-signature');
  if (!signature) {
    console.error('Webhook: Missing x-paystack-signature header');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    console.error('Webhook: Failed to read raw body');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  if (!verifySignature(rawBody, signature, secretKey)) {
    console.error('Webhook: Invalid signature');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error('Webhook: Invalid JSON body');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  const eventType = event.event;
  const data = event.data;

  try {
    if (eventType === 'charge.success') {
      await handleChargeSuccess(data);
    } else if (eventType === 'charge.failed') {
      const customer = data.customer as Record<string, unknown> | undefined;
      console.log('Webhook: Payment failed', {
        reference: data.reference,
        email: customer?.email,
        amount: data.amount,
        gateway_response: data.gateway_response,
      });
    } else {
      console.log(`Webhook: Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Webhook: Error handling ${eventType}:`, error);
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;
  const customer = data.customer as Record<string, unknown> | undefined;
  const email = (customer?.email as string || '').trim().toLowerCase();
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const referralCode = (metadata?.referral_code as string) || null;

  if (!reference) {
    console.error('Webhook charge.success: Missing reference');
    return;
  }

  // Handle agency credit pack purchase
  if (metadata?.type === 'agency_credit_pack') {
    await handleAgencyCreditPack(reference, metadata);
    return;
  }

  // Handle individual credit topup
  if (metadata?.type === 'credit_topup') {
    await handleCreditTopup(reference, metadata);
    return;
  }

  console.log('Webhook: charge.success', { reference, email });

  const supabase = createSupabaseAdmin();

  const { data: existingByToken } = await supabase
    .from('activations')
    .select('*')
    .eq('token', reference)
    .single();

  if (existingByToken && existingByToken.used) {
    console.log('Webhook: Activation already processed for reference:', reference);
    return;
  }

  const { data: existingByEmail } = await supabase
    .from('activations')
    .select('*')
    .eq('email', email)
    .eq('used', false)
    .limit(1)
    .single();

  if (existingByEmail) {
    console.log('Webhook: Pending activation already exists for email:', email);
    return;
  }

  const activationToken = uuidv4();

  if (existingByToken) {
    await supabase
      .from('activations')
      .update({
        token: activationToken,
        email,
        used: false,
        affiliate_ref: referralCode,
      })
      .eq('id', existingByToken.id);
  } else {
    await supabase.from('activations').insert({
      id: uuidv4(),
      token: activationToken,
      email,
      used: false,
      affiliate_ref: referralCode,
    });
  }

  if (referralCode) {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (affiliate) {
      await supabase
        .from('affiliates')
        .update({
          total_referrals: affiliate.total_referrals + 1,
          total_earnings: Number(affiliate.total_earnings) + 7.5,
        })
        .eq('id', affiliate.id);
    }
  }

  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${activationToken}`;
  console.log('============================================');
  console.log('WEBHOOK ACTIVATION EMAIL');
  console.log('============================================');
  console.log(`To: ${email}`);
  console.log(`Activation Link: ${activationUrl}`);
  console.log('============================================');

  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/send-activation-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: activationToken }),
      }
    );
  } catch (emailError) {
    console.error('Webhook: Failed to send activation email:', emailError);
  }
}

async function handleAgencyCreditPack(reference: string, metadata: Record<string, unknown>) {
  const supabase = createSupabaseAdmin();
  const workspaceId = metadata.workspace_id as string;
  const credits = metadata.credits as number;
  const userToken = metadata.user_token as string;

  if (!workspaceId || !credits) {
    console.error('Webhook: Missing workspace_id or credits in metadata');
    return;
  }

  // Check if already processed
  const { data: purchase } = await supabase
    .from('credit_purchases')
    .select('status')
    .eq('reference', reference)
    .single();

  if (purchase?.status === 'completed') {
    console.log('Webhook: Credit pack already processed for reference:', reference);
    return;
  }

  // Add credits to workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('credits_remaining')
    .eq('id', workspaceId)
    .single();

  if (!workspace) {
    console.error('Webhook: Workspace not found:', workspaceId);
    return;
  }

  await supabase
    .from('workspaces')
    .update({ credits_remaining: workspace.credits_remaining + credits })
    .eq('id', workspaceId);

  // Mark purchase as completed
  await supabase
    .from('credit_purchases')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('reference', reference);

  // Log activity
  await supabase.from('workspace_activity').insert({
    workspace_id: workspaceId,
    user_token: userToken,
    member_name: 'System',
    action: 'credit_added',
    resource_type: 'credit',
    metadata: { amount: credits, description: `Purchased ${credits} credit pack` },
  });

  console.log(`Webhook: Added ${credits} credits to workspace ${workspaceId}`);
}

async function handleCreditTopup(reference: string, metadata: Record<string, unknown>) {
  const supabase = createSupabaseAdmin();
  const userToken = metadata.user_token as string;
  const credits = metadata.credits as number;

  if (!userToken || !credits) {
    console.error('Webhook: Missing user_token or credits in credit_topup metadata');
    return;
  }

  // Check if already processed (idempotency)
  const { data: existingTx } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('user_token', userToken)
    .eq('description', `Credit topup: ${credits} credits`)
    .limit(1)
    .single();

  if (existingTx) {
    console.log('Webhook: Credit topup already processed for reference:', reference);
    return;
  }

  // Get current balance
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('balance, total_purchased')
    .eq('user_token', userToken)
    .single();

  const currentBalance = Number(userCredits?.balance || 0);
  const newBalance = currentBalance + credits;
  const newTotalPurchased = Number(userCredits?.total_purchased || 0) + credits;

  if (userCredits) {
    await supabase
      .from('user_credits')
      .update({ balance: newBalance, total_purchased: newTotalPurchased, updated_at: new Date().toISOString() })
      .eq('user_token', userToken);
  } else {
    await supabase.from('user_credits').insert({
      user_token: userToken,
      balance: newBalance,
      total_purchased: newTotalPurchased,
    });
  }

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'purchase',
    amount: credits,
    description: `Credit topup: ${credits} credits`,
    balance_after: newBalance,
  });

  console.log(`Webhook: Added ${credits} credits to user ${userToken}, new balance: ${newBalance}`);
}
