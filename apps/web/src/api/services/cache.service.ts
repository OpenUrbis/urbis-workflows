import { LRUCache } from "lru-cache";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  entitiesHash?: string;
}

export interface CacheOptions {
  storageKey: string;
  maxSize?: number;
  maxEntries?: number;
  ttl?: number;
  updateAgeOnGet?: boolean;
}

export class CacheService {
  private cache: LRUCache<string, CacheEntry<any>>;
  private storageKey: string;

  constructor(options?: CacheOptions) {
    this.cache = new LRUCache<string, CacheEntry<any>>({
      max: options?.maxEntries,
      ttl: options?.ttl ?? 1000 * 60 * 60 * 24 * 7, // 7 days
      ttlAutopurge: true, // Add this line to enable automatic purging
      updateAgeOnGet: options?.updateAgeOnGet ?? false,
    });
    this.storageKey = options?.storageKey ?? "workflows_cache";

    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const savedCache = localStorage.getItem(this.storageKey);
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        Object.entries(parsed).forEach(([key, value]) => {
          const entry = value as CacheEntry<any>;
          if (entry && typeof entry === "object") {
            this.cache.set(key, {
              data: entry.data,
              timestamp: Number(entry.timestamp),
              entitiesHash: entry.entitiesHash,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error loading cache from storage:", error);
    }
  }

  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries()) as [
        string,
        CacheEntry<any>,
      ][];
      const cacheObject = Object.fromEntries(
        entries.map(([key, value]) => [
          key,
          {
            data: value.data,
            timestamp: Number(value.timestamp),
            entitiesHash: value.entitiesHash,
          },
        ])
      );
      localStorage.setItem(this.storageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.error("Error saving cache to storage:", error);
    }
  }

  set<T>(key: string, data: T, entitiesHash?: string): void {
    this.cache.set(key, {
      data,
      timestamp: new Date().getTime() + new Date().getTimezoneOffset(),
      entitiesHash,
    });
    this.saveToStorage();
  }

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  getTimestamp(key: string): number | undefined {
    const entry = this.cache.get(key);
    return entry ? Number(entry.timestamp) : undefined;
  }

  getHash(key: string): string | undefined {
    const entry = this.cache.get(key);
    return entry?.entitiesHash;
  }

  update<T>(
    key: string,
    newData: T,
    mergeStrategy?: (cached: T, fresh: T) => T,
    entitiesHash?: string
  ): void {
    const cached = this.get<T>(key);
    if (cached) {
      const mergedData = mergeStrategy
        ? mergeStrategy(cached.data, newData)
        : newData;

      this.set(key, mergedData, entitiesHash);
    } else {
      this.set(key, newData, entitiesHash);
    }
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
    this.saveToStorage();
  }
}
