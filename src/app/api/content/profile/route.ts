import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leadId = request.nextUrl.searchParams.get('lead_id');
  const supabase = createSupabaseAdmin();

  if (leadId) {
    const { data: existing } = await supabase
      .from('content_profiles')
      .select('*')
      .eq('user_token', userToken)
      .eq('lead_id', leadId)
      .single();

    if (existing) {
      return NextResponse.json({ exists: true, profile: existing });
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      exists: false,
      prefilled: {
        business_name: lead.name,
        business_type: lead.type || '',
        location: lead.address || '',
        website: lead.website || '',
        phone: lead.phone || '',
        instagram: null,
        facebook: null,
        tiktok: null,
        twitter: null,
        linkedin: null,
        whatsapp: lead.phone || '',
      },
    });
  }

  const { data: profiles } = await supabase
    .from('content_profiles')
    .select('*')
    .eq('user_token', userToken)
    .order('updated_at', { ascending: false });

  return NextResponse.json({ profiles: profiles || [] });
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    id, lead_id, business_name, business_type, location, website, phone,
    instagram, facebook, tiktok, twitter, linkedin, whatsapp,
    services, tagline, brand_voice, target_audience, usp, brand_colors,
    default_platforms, always_include_phone, always_include_handles,
  } = body;

  if (!business_name || !business_type) {
    return NextResponse.json({ error: 'business_name and business_type are required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const profileData = {
    user_token: userToken,
    lead_id: lead_id || null,
    business_name,
    business_type,
    location: location || null,
    website: website || null,
    phone: phone || null,
    instagram: instagram || null,
    facebook: facebook || null,
    tiktok: tiktok || null,
    twitter: twitter || null,
    linkedin: linkedin || null,
    whatsapp: whatsapp || null,
    services: services || null,
    tagline: tagline || null,
    brand_voice: brand_voice || 'friendly',
    target_audience: target_audience || null,
    usp: usp || null,
    brand_colors: brand_colors || null,
    default_platforms: default_platforms || ['instagram', 'facebook'],
    always_include_phone: always_include_phone !== false,
    always_include_handles: always_include_handles !== false,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase
      .from('content_profiles')
      .update(profileData)
      .eq('id', id)
      .eq('user_token', userToken)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, profile: data });
  }

  if (lead_id) {
    const { data: existing } = await supabase
      .from('content_profiles')
      .select('id')
      .eq('user_token', userToken)
      .eq('lead_id', lead_id)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('content_profiles')
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, profile: data });
    }
  }

  const { data, error } = await supabase
    .from('content_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: data });
}
