import { NextRequest } from 'next/server';
import { searchBusinesses } from '@/lib/serpapi';
import { scrapeEmail } from '@/lib/scrape-email';
import { createSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, SEARCH_RATE_LIMIT } from '@/lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';
import type { Lead } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sseData(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode('event: done\ndata: {}\n\n');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeQuery(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimit = checkRateLimit(`search:${ip}`, SEARCH_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { query: rawQuery, sessionId, isPaid } = body as {
    query: string;
    sessionId: string;
    isPaid: boolean;
  };

  const query = sanitizeQuery(rawQuery || '');

  if (!query || !sessionId) {
    return new Response(JSON.stringify({ error: 'query and sessionId are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (query.length < 5) {
    return new Response(
      JSON.stringify({ error: 'Search query must be at least 5 characters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createSupabaseAdmin();

  if (!isPaid && process.env.NEXT_PUBLIC_FREE_ACCESS !== 'true') {
    const { data: trialRecord } = await supabase
      .from('free_trial_searches')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (trialRecord && trialRecord.count >= 2) {
      return new Response(JSON.stringify({ error: 'free_limit_reached' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!trialRecord) {
      await supabase.from('free_trial_searches').insert({
        id: uuidv4(),
        session_id: sessionId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        count: 1,
      });
    } else {
      await supabase
        .from('free_trial_searches')
        .update({ count: trialRecord.count + 1 })
        .eq('session_id', sessionId);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      let searchId: string | null = null;
      const allLeads: Lead[] = [];
      let aborted = false;

      const abortHandler = () => {
        aborted = true;
      };

      request.signal.addEventListener('abort', abortHandler);

      try {
        const { data: searchData } = await supabase
          .from('searches')
          .insert({
            id: uuidv4(),
            user_token: sessionId,
            query,
            result_count: 0,
          })
          .select()
          .single();

        searchId = searchData?.id ?? null;

        const serpResults = await searchBusinesses(query);

        console.log('SerpAPI leads sample:', JSON.stringify(serpResults.slice(0, 3), null, 2));
        console.log('Leads with websites:', serpResults.filter((l) => l.website).length);
        console.log('Leads without websites:', serpResults.filter((l) => !l.website).length);

        const leads: Lead[] = serpResults.map((item) => ({
          id: uuidv4(),
          search_id: searchId || '',
          name: item.name,
          phone: item.phone,
          email: null,
          website: item.website,
          address: item.address,
          rating: item.rating,
          reviews: item.reviews,
          type: item.type,
          thumbnail: item.thumbnail,
          status: 'new' as const,
          place_id: item.place_id,
          created_at: new Date().toISOString(),
        }));

        for (let i = 0; i < leads.length; i++) {
          if (aborted) break;

          const lead = { ...leads[i] };
          if (searchId) {
            lead.search_id = searchId;
          }

          allLeads.push(lead);
          controller.enqueue(sseEvent('lead', lead));

          if (i < leads.length - 1) {
            await delay(80);
          }
        }

        if (!aborted && isPaid) {
          const leadsWithWebsites = allLeads.filter((lead) => lead.website);
          console.log(`Scraping emails for ${leadsWithWebsites.length} leads with websites...`);

          const scrapePromises = leadsWithWebsites
            .map(async (lead) => {
              try {
                console.log(`Scraping: ${lead.website}`);
                const email = await scrapeEmail(lead.website!);

                if (email) {
                  console.log(`Found email for ${lead.name}: ${email}`);
                  await supabase
                    .from('leads')
                    .update({ email })
                    .eq('place_id', lead.place_id)
                    .eq('search_id', searchId);

                  lead.email = email;
                  controller.enqueue(
                    sseEvent('email', { place_id: lead.place_id, email })
                  );
                } else {
                  console.log(`No email found for ${lead.name} (${lead.website})`);
                }
              } catch (err) {
                console.error(`Email scrape failed for ${lead.website}:`, err);
              }
            });

          await Promise.allSettled(scrapePromises);
        }

        if (searchId && allLeads.length > 0) {
          const leadsToInsert = allLeads.map((lead) => ({
            id: lead.id,
            search_id: lead.search_id || searchId,
            place_id: lead.place_id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            website: lead.website,
            address: lead.address,
            rating: lead.rating,
            status: lead.status,
          }));

          await supabase.from('leads').insert(leadsToInsert);

          await supabase
            .from('searches')
            .update({ result_count: allLeads.length })
            .eq('id', searchId);
        }

        controller.enqueue(sseDone());
      } catch (error) {
        if (!aborted) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
          controller.enqueue(
            sseData({ type: 'error', error: errorMessage })
          );
          controller.enqueue(sseDone());
        }
      } finally {
        request.signal.removeEventListener('abort', abortHandler);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
