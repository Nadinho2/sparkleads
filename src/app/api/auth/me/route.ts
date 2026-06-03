import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('sparkleads_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const supabase = createSupabaseAdmin();
  const { data: activation } = await supabase
    .from('activations')
    .select('email, user_token')
    .eq('user_token', token)
    .eq('used', true)
    .limit(1)
    .single();

  if (!activation) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    email: activation.email,
    user_token: activation.user_token,
  });
}
