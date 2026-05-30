import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { setTokenCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseAdmin();

  const { data: activation } = await supabase
    .from('activations')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('used', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!activation) {
    return NextResponse.json(
      { error: 'No account found with this email' },
      { status: 404 }
    );
  }

  const userToken = activation.user_token;

  if (!userToken) {
    return NextResponse.json(
      {
        error:
          'Your account was created before multi-device login was available. Please activate again using your original activation link, or contact support.',
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true });
  const cookie = setTokenCookie(userToken);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    maxAge: cookie.maxAge,
    path: cookie.path,
  });

  return response;
}
