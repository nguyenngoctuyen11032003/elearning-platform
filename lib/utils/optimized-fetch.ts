// Optimized API fetch with request deduplication and caching

class OptimizedApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch with automatic deduplication - multiple simultaneous requests
   * to the same endpoint will only make one network call
   */
  async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const cacheKey = `${options?.method || 'GET'}_${url}`;

    // Check cache first
    if (options?.method === 'GET' || !options?.method) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Make new request
    const promise = fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Cache GET requests
        if (options?.method === 'GET' || !options?.method) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }
        return data;
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
      });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  /**
   * Invalidate cache for specific pattern
   */
  invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const optimizedApiClient = new OptimizedApiClient();

/**
 * Prefetch data for faster navigation
 */
export function prefetchData(urls: string[]) {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains for faster requests
 */
export function preconnectDomain(domain: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}
