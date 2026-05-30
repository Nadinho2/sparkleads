import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    google: !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
    paystack: !!process.env.PAYSTACK_SECRET_KEY,
    supabase:
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const allHealthy = Object.values(envCheck).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      env_check: envCheck,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
