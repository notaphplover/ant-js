import { CacheOptions } from './CacheOptions';

export interface IEntitySearchOptions {
  /**
   * Determines if the entity must be cached if not found in cache.
   */
  cacheOptions: CacheOptions;

  /**
   * TTL of the entity. A null value represents no TTL.
   */
  ttl: number;
}
