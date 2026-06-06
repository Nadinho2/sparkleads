import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/affiliate', '/agency'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sparkleads_token')?.value;

  if (!token) {
    const loginUrl = new URL('/freetrial', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const workspaceId = request.cookies.get('sparkleads_workspace')?.value;

  const response = NextResponse.next();
  response.headers.set('x-user-token', token);
  response.headers.set('x-workspace-id', workspaceId || '');
  response.headers.set('x-account-type', workspaceId ? 'agency' : 'individual');

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/affiliate/:path*', '/agency/:path*'],
};
