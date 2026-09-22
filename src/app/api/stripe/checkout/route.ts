import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, CREDIT_PACKS } from '@/lib/stripe';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planId,
      billingInterval = 'month',
      packId,
      workspaceId,
      email: inputEmail,
    } = body as {
      planId?: string;
      billingInterval?: 'month' | 'year';
      packId?: string;
      workspaceId?: string;
      email?: string;
    };

    const origin = request.headers.get('origin') || request.nextUrl.origin || 'https://sparkleads.ai';
    const userToken = getToken() || body.userToken || '';
    const customerEmail = (inputEmail || '').trim().toLowerCase();

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        {
          error: 'stripe_not_configured',
          message: 'Stripe payments are currently in review mode. Please configure STRIPE_SECRET_KEY in your environment variables.',
        },
        { status: 503 }
      );
    }

    // Case 1: One-time credit pack purchase
    if (packId) {
      const pack = CREDIT_PACKS[packId];
      if (!pack) {
        return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `SparkLeads ${pack.name}`,
                description: `${pack.credits.toLocaleString()} lead & AI generation credits (never expires)`,
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: customerEmail || undefined,
        metadata: {
          type: 'credit_pack',
          packId,
          credits: pack.credits.toString(),
          userToken,
          workspaceId: workspaceId || '',
        },
        success_url: workspaceId
          ? `${origin}/agency/billing?payment_success=true&credits=${pack.credits}`
          : `${origin}/dashboard?payment_success=true&credits=${pack.credits}`,
        cancel_url: workspaceId ? `${origin}/agency/billing?cancelled=true` : `${origin}/dashboard?cancelled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Case 2: Subscription Plan (Solo, Growth, Agency)
    const targetPlanId = planId || 'solo';
    const plan = PLANS[targetPlanId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const isAnnual = billingInterval === 'year';
    const unitAmount = isAnnual ? plan.priceAnnual : plan.priceMonthly;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SparkLeads ${plan.name} Plan`,
              description: `${plan.monthlyCredits.toLocaleString()} monthly leads/credits • ${plan.seats === 999 ? 'Unlimited' : plan.seats} seat(s)`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: isAnnual ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: customerEmail || undefined,
      metadata: {
        type: 'subscription',
        planId: targetPlanId,
        billingInterval,
        userToken,
        workspaceId: workspaceId || '',
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${targetPlanId}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[STRIPE_CHECKOUT_ERROR]:', error);
    const msg = error instanceof Error ? error.message : 'Failed to initialize checkout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
