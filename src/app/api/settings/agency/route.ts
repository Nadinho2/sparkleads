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
    .select('agency_name, agency_contact, agency_title, default_currency, payment_terms, freelancer_type')
    .eq('user_token', userToken)
    .single();

  return NextResponse.json({
    agencyName: data?.agency_name || '',
    agencyContact: data?.agency_contact || '',
    agencyTitle: data?.agency_title || '',
    defaultCurrency: data?.default_currency || 'NGN',
    paymentTerms: data?.payment_terms || '',
    freelancerType: data?.freelancer_type || '',
  });
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { agencyName, agencyContact, agencyTitle, defaultCurrency, paymentTerms, freelancerType } = body;

  const supabase = createSupabaseAdmin();

  const upsertData: Record<string, unknown> = {
    user_token: userToken,
    updated_at: new Date().toISOString(),
  };
  if (agencyName !== undefined) upsertData.agency_name = agencyName;
  if (agencyContact !== undefined) upsertData.agency_contact = agencyContact;
  if (agencyTitle !== undefined) upsertData.agency_title = agencyTitle;
  if (defaultCurrency !== undefined) upsertData.default_currency = defaultCurrency;
  if (paymentTerms !== undefined) upsertData.payment_terms = paymentTerms;
  if (freelancerType !== undefined) upsertData.freelancer_type = freelancerType;

  const { error } = await supabase
    .from('user_settings')
    .upsert(upsertData, { onConflict: 'user_token' });

  if (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
