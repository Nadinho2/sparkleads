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
    const seenPlaceIds = new Set<string>();

    // Fetch up to 12 pages (20 results each) = 240 max results
    const maxPages = 12;
    const pageSize = 20;

    for (let page = 0; page < maxPages; page++) {
      try {
        const response = await getJson({
          engine: 'google_maps',
          q: query,
          type: 'search',
          start: page * pageSize,
          api_key: process.env.SERPAPI_KEY,
        });

        const results = response.local_results || [];

        if (results.length === 0) break;

        for (const item of results) {
          const placeId = (item.place_id as string) || (item.data_id as string) || crypto.randomUUID();

          // Deduplicate by place_id
          if (seenPlaceIds.has(placeId)) continue;
          seenPlaceIds.add(placeId);

          allResults.push({
            place_id: placeId,
            name: (item.title as string) || 'Unknown Business',
            phone: (item.phone as string) || null,
            website: (item.website as string) || null,
            address: (item.address as string) || null,
            rating: item.rating ? parseFloat(item.rating as string) : null,
            reviews: (item.reviews as number) || null,
            type: (item.type as string) || null,
            thumbnail: (item.thumbnail as string) || null,
          });
        }

        // Small delay between pages to avoid rate limiting
        if (page < maxPages - 1 && results.length > 0) {
          await new Promise(r => setTimeout(r, 300));
        }
      } catch (pageError) {
        console.error(`SerpAPI page ${page} error:`, pageError);
        break;
      }
    }

    console.log(`SerpAPI: Found ${allResults.length} unique leads for "${query}"`);
    return allResults;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}
