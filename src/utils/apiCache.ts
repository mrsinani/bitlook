interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ApiCache {
  [key: string]: CacheEntry<any>;
}

// In-memory cache
const cache: ApiCache = {};

// Default TTL is 5 minutes (300,000ms)
const DEFAULT_TTL = 300000;

export const getCachedData = <T>(key: string, ttl = DEFAULT_TTL): T | null => {
  const entry = cache[key];
  
  if (!entry) {
    console.log(`No cache entry found for key: ${key}`);
    return null;
  }
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // If ttl is Infinity, return data regardless of expiration
  if (ttl === Infinity) {
    console.log(`Using expired cache for key: ${key}, age: ${age}ms`);
    return entry.data;
  }
  
  const isExpired = age > ttl;
  
  // Return null if cache is expired
  if (isExpired) {
    console.log(`Cache expired for key: ${key}, age: ${age}ms, ttl: ${ttl}ms`);
    return null;
  }
  
  console.log(`Valid cache hit for key: ${key}, age: ${age}ms, ttl: ${ttl}ms`);
  return entry.data;
};

export const setCachedData = <T>(key: string, data: T): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
};

export const isCacheValid = (key: string, ttl = DEFAULT_TTL): boolean => {
  const entry = cache[key];
  
  if (!entry) {
    return false;
  }
  
  const now = Date.now();
  return now - entry.timestamp <= ttl;
};

export const getCacheAge = (key: string): number | null => {
  const entry = cache[key];
  
  if (!entry) {
    return null;
  }
  
  return Date.now() - entry.timestamp;
};

export const clearCache = (key?: string): void => {
  if (key) {
    delete cache[key];
  } else {
    // Clear all cache if no key specified
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}; 