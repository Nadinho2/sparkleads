import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data } = await supabase
    .from('user_settings')
    .select('agency_name, agency_contact, agency_title, default_currency, payment_terms')
    .eq('user_token', userToken)
    .single();

  return NextResponse.json({
    agencyName: data?.agency_name || '',
    agencyContact: data?.agency_contact || '',
    agencyTitle: data?.agency_title || '',
    defaultCurrency: data?.default_currency || 'NGN',
    paymentTerms: data?.payment_terms || '',
  });
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { agencyName, agencyContact, agencyTitle, defaultCurrency, paymentTerms } = body;

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_token: userToken,
      agency_name: agencyName,
      agency_contact: agencyContact,
      agency_title: agencyTitle,
      default_currency: defaultCurrency,
      payment_terms: paymentTerms,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_token' });

  if (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
