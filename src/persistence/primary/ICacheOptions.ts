import { CacheMode } from './CacheMode';

export interface ICacheOptions {
  /**
   * Determines if the entity must be cached if not found in cache.
   */
  cacheOptions: CacheMode;

  /**
   * TTL of the entity. A null value represents no TTL.
   */
  ttl: number;
}
