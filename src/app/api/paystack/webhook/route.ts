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
