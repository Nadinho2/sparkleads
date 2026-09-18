import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'sparkleads_admin_session';
const ADMIN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET_KEY || 'sparkleads-admin-2024';
}

/**
 * Verify whether the incoming request has valid admin credentials
 * via 'x-admin-key' header OR 'sparkleads_admin_session' cookie.
 */
export function verifyAdmin(request: NextRequest): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  const headerKey = request.headers.get('x-admin-key');
  if (headerKey && headerKey === secret) {
    return true;
  }

  const cookieKey = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieKey && cookieKey === secret) {
    return true;
  }

  return false;
}

/**
 * Server Component check using next/headers cookies()
 */
export function isAdminAuthenticated(): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  try {
    const cookieStore = cookies();
    const cookieVal = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return cookieVal === secret;
  } catch {
    return false;
  }
}

export function getAdminCookieOptions(): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    name: ADMIN_COOKIE_NAME,
    value: getAdminSecret(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function getClearAdminCookieOptions(): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };
}
