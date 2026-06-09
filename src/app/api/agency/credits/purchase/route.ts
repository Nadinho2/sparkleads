import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/agency-auth';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// Prices in kobo (Paystack uses smallest currency unit)
const PACKS: Record<number, number> = {
  50: 660000,     // ₦6,600
  150: 1330000,   // ₦13,300
  500: 3320000,   // ₦33,200
};

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });

  const body = await request.json();
  const { credits } = body as { credits: number };

  if (!credits || !PACKS[credits]) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Get user email
  const { data: activation } = await supabase
    .from('activations')
    .select('email')
    .eq('user_token', token)
    .eq('used', true)
    .limit(1)
    .single();

  const email = activation?.email || '';
  if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 400 });

  const reference = `agency_credits_${uuidv4().slice(0, 12)}_${Date.now()}`;
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

  try {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        amount: PACKS[credits],
        currency: 'NGN',
        reference,
        callback_url: `${origin}/agency/billing`,
        metadata: {
          type: 'agency_credit_pack',
          workspace_id: workspaceId,
          credits,
          user_token: token,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || 'Failed to initialize payment' }, { status: 400 });
    }

    // Store pending transaction
    await supabase.from('credit_purchases').insert({
      reference,
      user_token: token,
      workspace_id: workspaceId,
      credits,
      amount: PACKS[credits],
      status: 'pending',
    });

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
