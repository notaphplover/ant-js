import { CacheMode } from './CacheMode';

export interface IPersistencyUpdateOptions {
  /**
   * Determines if the entity must be cached if not found in cache.
   */
  cacheMode: CacheMode;

  /**
   * TTL of the entity (in milliseconds). A null value represents no TTL.
   */
  ttl: number;
}
