import { v4 as uuidv4 } from 'uuid';
import type { Lead } from '@/types';
import { getOrSet } from '@/lib/cache';

interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number | null;
  geometry: PlaceGeometry;
}

export interface PlaceDetails {
  name: string;
  formatted_phone_number: string | null;
  website: string | null;
  formatted_address: string;
  rating: number | null;
  url: string;
}

interface GooglePlacesTextSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    geometry: PlaceGeometry;
  }>;
  status: string;
  next_page_token?: string;
  error_message?: string;
}

interface GooglePlacesDetailsResponse {
  result: {
    name: string;
    formatted_phone_number?: string;
    website?: string;
    formatted_address: string;
    rating?: number;
    url: string;
  };
  status: string;
  error_message?: string;
}

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set');
  }
  return key;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBusinesses(query: string): Promise<PlaceResult[]> {
  const apiKey = getApiKey();
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  const data: GooglePlacesTextSearchResponse = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Google Places Text Search failed: ${data.status} - ${data.error_message || 'Unknown error'}`
    );
  }

  if (!data.results || data.results.length === 0) {
    return [];
  }

  return data.results.map((place) => ({
    place_id: place.place_id,
    name: place.name,
    formatted_address: place.formatted_address,
    rating: place.rating ?? null,
    geometry: place.geometry,
  }));
}

export async function searchBusinesses(query: string): Promise<PlaceResult[]> {
  return getOrSet(`places:search:${query}`, () => fetchBusinesses(query));
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = getApiKey();
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_phone_number,website,formatted_address,rating,url');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  const data: GooglePlacesDetailsResponse = await response.json();

  if (data.status !== 'OK') {
    throw new Error(
      `Google Places Details failed: ${data.status} - ${data.error_message || 'Unknown error'}`
    );
  }

  return {
    name: data.result.name,
    formatted_phone_number: data.result.formatted_phone_number ?? null,
    website: data.result.website ?? null,
    formatted_address: data.result.formatted_address,
    rating: data.result.rating ?? null,
    url: data.result.url,
  };
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  return getOrSet(`places:details:${placeId}`, () => fetchPlaceDetails(placeId));
}

export async function enrichLeads(places: PlaceResult[]): Promise<Lead[]> {
  const leads: Lead[] = [];

  for (const place of places) {
    try {
      const details = await getPlaceDetails(place.place_id);

      leads.push({
        id: uuidv4(),
        search_id: '',
        name: details.name,
        phone: details.formatted_phone_number,
        email: null,
        website: details.website,
        address: details.formatted_address,
        rating: details.rating,
        status: 'new',
        place_id: place.place_id,
        created_at: new Date().toISOString(),
      });
    } catch {
      leads.push({
        id: uuidv4(),
        search_id: '',
        name: place.name,
        phone: null,
        email: null,
        website: null,
        address: place.formatted_address,
        rating: place.rating,
        status: 'new',
        place_id: place.place_id,
        created_at: new Date().toISOString(),
      });
    }

    await delay(50);
  }

  return leads;
}
