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
    const response = await getJson({
      engine: 'google_maps',
      q: query,
      type: 'search',
      api_key: process.env.SERPAPI_KEY,
    });

    const results = response.local_results || [];

    return results.map((item: Record<string, unknown>): SerpLead => ({
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
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}
