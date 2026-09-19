import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const queueId = params.id;
  const targetUrl = request.nextUrl.searchParams.get('url');

  if (queueId) {
    try {
      const supabase = createSupabaseAdmin();
      await supabase
        .from('outreach_queue')
        .update({
          clicked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', queueId);
    } catch (err) {
      console.warn('[Tracking Link] Failed to record click:', err);
    }
  }

  // Safety fallback if no URL provided
  const destination = targetUrl && targetUrl.startsWith('http') ? targetUrl : 'https://www.trysparkleads.com';
  return NextResponse.redirect(destination, 302);
}
