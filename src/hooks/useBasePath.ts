'use client';

import { usePathname } from 'next/navigation';

/**
 * Returns the base path prefix for the current context.
 * When inside /agency, returns '/agency'. Otherwise returns '/dashboard'.
 * Use this to build navigation links that stay within the current workspace.
 */
export function useBasePath(): string {
  const pathname = usePathname();
  return pathname.startsWith('/agency') ? '/agency' : '/dashboard';
}
