interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 5 * 60 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  store.forEach((entry, key) => {
    if (now > entry.expiry) {
      store.delete(key);
    }
  });
}

export function getCached<T>(key: string): T | null {
  cleanup();

  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  cleanup();

  store.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

export function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetcher().then((data) => {
    setCache(key, data, ttlMs);
    return data;
  });
}

export function deleteCache(key: string): void {
  store.delete(key);
}

export function clearCache(): void {
  store.clear();
}
