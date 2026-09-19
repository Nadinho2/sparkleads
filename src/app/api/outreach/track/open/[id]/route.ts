import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// 1x1 Transparent GIF buffer (43 bytes)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const queueId = params.id;

  if (queueId) {
    try {
      const supabase = createSupabaseAdmin();
      // Fetch current open count
      const { data: item } = await supabase
        .from('outreach_queue')
        .select('id, open_count, opened_at')
        .eq('id', queueId)
        .single();

      if (item) {
        const nextCount = (item.open_count || 0) + 1;
        await supabase
          .from('outreach_queue')
          .update({
            open_count: nextCount,
            opened_at: item.opened_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueId);
      }
    } catch (err) {
      console.warn('[Tracking Pixel] Failed to record open:', err);
    }
  }

  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': '43',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
