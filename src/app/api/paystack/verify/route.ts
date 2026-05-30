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

    const { data: existingActivation } = await supabase
      .from('activations')
      .select('*')
      .eq('token', reference)
      .single();

    if (existingActivation && existingActivation.used) {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified. Check your email for the activation link.',
      });
    }

    const activationToken = uuidv4();
    const customerEmail = (email || paystackData.data.customer?.email || '').trim().toLowerCase();
    const referralCode = paystackData.data.metadata?.referral_code || null;

    if (existingActivation) {
      await supabase
        .from('activations')
        .update({
          token: activationToken,
          email: customerEmail,
          used: false,
          affiliate_ref: referralCode,
        })
        .eq('id', existingActivation.id);
    } else {
      await supabase.from('activations').insert({
        id: uuidv4(),
        token: activationToken,
        email: customerEmail,
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

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-activation-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            token: activationToken,
          }),
        }
      );
    } catch (emailError) {
      console.error('Failed to send activation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Check your email for the activation link',
    });
  } catch (error) {
    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
