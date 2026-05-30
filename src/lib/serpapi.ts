import { getJson } from 'serpapi';

export interface SerpLead {
  place_id: string;
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  type: string | null;
  thumbnail: string | null;
}

export async function searchBusinesses(query: string): Promise<SerpLead[]> {
  try {
    const allResults: SerpLead[] = [];
    const pages = [0, 20, 40, 60];

    for (const start of pages) {
      try {
        const response = await getJson({
          engine: 'google_maps',
          q: query,
          type: 'search',
          start: start,
          api_key: process.env.SERPAPI_KEY,
        });

        const results = response.local_results || [];

        if (results.length === 0) break;

        const mapped = results.map((item: Record<string, unknown>): SerpLead => ({
          place_id: (item.place_id as string) || (item.data_id as string) || crypto.randomUUID(),
          name: (item.title as string) || 'Unknown Business',
          phone: (item.phone as string) || null,
          website: (item.website as string) || null,
          address: (item.address as string) || null,
          rating: item.rating ? parseFloat(item.rating as string) : null,
          reviews: (item.reviews as number) || null,
          type: (item.type as string) || null,
          thumbnail: (item.thumbnail as string) || null,
        }));

        allResults.push(...mapped);

        if (start < 60) await new Promise(r => setTimeout(r, 300));
      } catch (pageError) {
        console.error(`SerpAPI page ${start} error:`, pageError);
        break;
      }
    }

    return allResults;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}
