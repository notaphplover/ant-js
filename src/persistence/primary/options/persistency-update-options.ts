import { CacheMode } from './cache-mode';
import { PersistencyBaseOptions } from './persistency-base-options';

export interface PersistencyUpdateOptions extends PersistencyBaseOptions {
  /**
   * Determines if the entity must be cached if not found in cache.
   */
  readonly cacheMode: CacheMode;

  /**
   * TTL of the entity (in milliseconds). A null value represents no TTL.
   */
  readonly ttl: number;
}
