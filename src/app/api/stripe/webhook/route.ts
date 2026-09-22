import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS } from '@/lib/stripe';
import { createSupabaseAdmin } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not initialized' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In development / before webhook secret is configured
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: unknown) {
    console.error('[STRIPE_WEBHOOK_VERIFY_ERROR]:', err);
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : 'Invalid signature'}` },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const customerEmail = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase();

    // Type 1: One-time Credit Pack Purchase
    if (metadata.type === 'credit_pack') {
      const creditsToAdd = parseInt(metadata.credits || '0', 10);
      const workspaceId = metadata.workspaceId;
      const userToken = metadata.userToken;

      if (workspaceId && creditsToAdd > 0) {
        // Workspace credit addition
        const { data: ws } = await supabase
          .from('workspaces')
          .select('credits_remaining')
          .eq('id', workspaceId)
          .single();

        if (ws) {
          const updatedBalance = (ws.credits_remaining || 0) + creditsToAdd;
          await supabase
            .from('workspaces')
            .update({ credits_remaining: updatedBalance })
            .eq('id', workspaceId);
        }
      } else if (userToken && creditsToAdd > 0) {
        // Individual credit addition
        const { data: userCreds } = await supabase
          .from('user_credits')
          .select('balance, total_purchased')
          .eq('user_token', userToken)
          .single();

        const currentBalance = userCreds?.balance || 0;
        const totalPurchased = (userCreds?.total_purchased || 0) + creditsToAdd;
        const newBalance = currentBalance + creditsToAdd;

        await supabase
          .from('user_credits')
          .update({
            balance: newBalance,
            total_purchased: totalPurchased,
            updated_at: new Date().toISOString(),
          })
          .eq('user_token', userToken);

        await supabase.from('credit_transactions').insert({
          user_token: userToken,
          type: 'purchase',
          amount: creditsToAdd,
          description: `Stripe checkout — added ${creditsToAdd.toLocaleString()} credits`,
          balance_after: newBalance,
        });

        await createNotification(userToken, {
          title: '⚡ Credits Added',
          message: `Your account has been credited with ${creditsToAdd.toLocaleString()} credits.`,
          type: 'credit',
          link: '/dashboard',
        });
      }
    }

    // Type 2: Recurring Subscription Activation
    if (metadata.type === 'subscription') {
      const planId = metadata.planId || 'solo';
      const planConfig = PLANS[planId] || PLANS.solo;
      const workspaceId = metadata.workspaceId;
      let userToken = metadata.userToken;

      if (workspaceId) {
        // Agency workspace plan upgrade
        const seatsLimit = planConfig.seats;
        const monthlyCredits = planConfig.monthlyCredits;

        const { data: ws } = await supabase
          .from('workspaces')
          .select('credits_remaining')
          .eq('id', workspaceId)
          .single();

        const newBalance = (ws?.credits_remaining || 0) + monthlyCredits;

        await supabase
          .from('workspaces')
          .update({
            plan: planId,
            monthly_credits: monthlyCredits,
            credits_remaining: newBalance,
            seats_limit: seatsLimit,
          })
          .eq('id', workspaceId);
      } else {
        // Solo or individual subscriber
        if (!userToken && customerEmail) {
          const { data: existing } = await supabase
            .from('activations')
            .select('user_token')
            .eq('email', customerEmail)
            .limit(1)
            .maybeSingle();

          userToken = existing?.user_token;
        }

        if (userToken) {
          const { data: userCreds } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_token', userToken)
            .single();

          const currentBalance = userCreds?.balance || 0;
          const newBalance = currentBalance + planConfig.monthlyCredits;

          await supabase
            .from('user_credits')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('user_token', userToken);

          await supabase.from('credit_transactions').insert({
            user_token: userToken,
            type: 'subscription',
            amount: planConfig.monthlyCredits,
            description: `${planConfig.name} Plan activated — +${planConfig.monthlyCredits.toLocaleString()} monthly credits`,
            balance_after: newBalance,
          });

          await createNotification(userToken, {
            title: '🎉 Subscription Activated!',
            message: `Welcome to SparkLeads ${planConfig.name}. ${planConfig.monthlyCredits.toLocaleString()} credits are now active in your dashboard!`,
            type: 'subscription',
            link: '/dashboard',
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
