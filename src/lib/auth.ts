import { cookies } from 'next/headers';

const COOKIE_NAME = 'sparkleads_token';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export function getToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function requireAuth(): string {
  const token = getToken();
  if (!token) {
    throw new Error('Unauthorized');
  }
  return token;
}

export function setTokenCookie(token: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}
