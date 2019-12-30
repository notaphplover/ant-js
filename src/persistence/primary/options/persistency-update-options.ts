import { CacheMode } from './cache-mode';

export interface PersistencyUpdateOptions {
  /**
   * Determines if the entity must be cached if not found in cache.
   */
  readonly cacheMode: CacheMode;

  /**
   * TTL of the entity (in milliseconds). A null value represents no TTL.
   */
  readonly ttl: number;
}
