import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 500 }
    );
  }

  let body: { reference?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { reference, email } = body;

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const customerEmail = (email || paystackData.data.customer?.email || '').trim().toLowerCase();
    const referralCode = paystackData.data.metadata?.referral_code || null;

    // Check if this email already has an activated account
    const { data: existingUser } = await supabase
      .from('activations')
      .select('user_token')
      .eq('email', customerEmail)
      .eq('used', true)
      .limit(1)
      .single();

    if (existingUser?.user_token) {
      // Already activated — just set cookie and return
      const response = NextResponse.json({
        success: true,
        message: 'Account already activated',
      });
      response.cookies.set('sparkleads_token', existingUser.user_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
      return response;
    }

    // New user — activate directly
    const userToken = uuidv4();

    // Check if there's a pending activation record for this reference
    const { data: existingActivation } = await supabase
      .from('activations')
      .select('*')
      .eq('token', reference)
      .single();

    if (existingActivation) {
      // Update existing record to activated
      await supabase
        .from('activations')
        .update({
          used: true,
          user_token: userToken,
          email: customerEmail,
          affiliate_ref: referralCode,
        })
        .eq('id', existingActivation.id);
    } else {
      // Create new activated record
      await supabase.from('activations').insert({
        id: uuidv4(),
        token: userToken,
        email: customerEmail,
        used: true,
        user_token: userToken,
        affiliate_ref: referralCode,
      });
    }

    // Create user credits (20 welcome credits)
    await supabase.from('user_credits').insert({
      user_token: userToken,
      balance: 20,
      total_purchased: 0,
    });

    await supabase.from('credit_transactions').insert({
      user_token: userToken,
      type: 'bonus',
      amount: 20,
      description: 'Welcome bonus — 20 free outreach credits',
      balance_after: 20,
    });

    // Create affiliate record
    const referralCodeGen = userToken.slice(0, 8);
    await supabase.from('affiliates').insert({
      id: uuidv4(),
      user_token: userToken,
      referral_code: referralCodeGen,
      total_referrals: 0,
      total_earnings: 0,
    });

    // Track affiliate referral if applicable
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

    // Also send activation email as backup (non-blocking)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-activation-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            token: userToken,
          }),
        }
      );
    } catch {
      // Email failure is non-critical — user is already activated
    }

    // Set auth cookie and return success
    const response = NextResponse.json({
      success: true,
      message: 'Account activated successfully',
    });
    response.cookies.set('sparkleads_token', userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
