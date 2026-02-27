import { prisma } from "@/prisma/prisma.config";

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  LIVE_CALLS: 5,        // 5 seconds (real-time data)
  QUEUES: 15,           // 15 seconds
  PRESENCE: 30,         // 30 seconds
  OVERVIEW: 60,         // 1 minute
  AUDIT: 120,           // 2 minutes
  CDR: 300,             // 5 minutes (heavy queries)
  INVENTORY: 600,       // 10 minutes
} as const;

/**
 * Get cached data by key
 * Returns null if cache miss or expired
 */
export async function getCache<T>(cacheKey: string): Promise<T | null> {
  const cached = await prisma.apiCache.findUnique({
    where: { cacheKey },
  });

  if (!cached) {
    return null;
  }

  // Check if expired
  if (cached.expiresAt < new Date()) {
    // Optionally delete expired entry
    await prisma.apiCache.delete({
      where: { cacheKey },
    });
    return null;
  }

  // Parse and return cached data
  return JSON.parse(cached.data) as T;
}

/**
 * Set cached data with TTL
 */
export async function setCache<T>(
  cacheKey: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.apiCache.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      data: JSON.stringify(data),
      expiresAt,
    },
    update: {
      data: JSON.stringify(data),
      expiresAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete cached data by key
 */
export async function deleteCache(cacheKey: string): Promise<void> {
  await prisma.apiCache.delete({
    where: { cacheKey },
  }).catch(() => {
    // Ignore if key doesn't exist
  });
}

/**
 * Clear all expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const result = await prisma.apiCache.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Get or set cache with lazy update pattern
 * If cache exists and not expired, return it
 * If cache missing or expired, fetch new data and cache it
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const data = await fetchFn();

  // Store in cache (fire and forget - don't await)
  setCache(cacheKey, data, ttlSeconds).catch((error) => {
    console.error("Failed to cache data:", error);
  });

  return data;
}
