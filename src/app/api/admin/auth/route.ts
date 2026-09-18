import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminSecret,
  verifyAdmin,
  getAdminCookieOptions,
  getClearAdminCookieOptions,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authenticated = verifyAdmin(request);
  return NextResponse.json({ authenticated });
}

export async function POST(request: NextRequest) {
  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const key = body.key || (body as any).secretKey;
  const secret = getAdminSecret();

  if (!key || key !== secret) {
    return NextResponse.json({ error: 'Invalid admin secret key' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message: 'Admin authenticated' });
  const cookieOpts = getAdminCookieOptions();
  response.cookies.set(cookieOpts.name, cookieOpts.value, cookieOpts);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out from admin' });
  const cookieOpts = getClearAdminCookieOptions();
  response.cookies.set(cookieOpts.name, cookieOpts.value, cookieOpts);
  return response;
}
