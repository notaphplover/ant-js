import { CacheMode } from './CacheMode';
import { ICacheOptions } from './ICacheOptions';

export class CacheOptions implements ICacheOptions {
  /**
   * Cache options.
   */
  protected _cacheOptions: CacheMode;
  /**
   * TTL of the entity (in milliseconds). A null value represents no TTL.
   */
  protected _ttl?: number;

  /**
   * Creates a new entity search options.
   * @param cacheOptions Cache options.
   * @param ttl TTL of the entity. A null value represents no TTL.
   */
  public constructor(
    cacheOptions: CacheMode = CacheMode.CacheAndOverwrite,
    ttl: number = null,
  ) {
    this._cacheOptions = cacheOptions;
    this._ttl = ttl;
  }

  /**
   * Cache options.
   */
  public get cacheOptions(): CacheMode {
    return this._cacheOptions;
  }

  /**
   * TTL of the entity. A null value represents no TTL.
   */
  public get ttl(): number {
    return this._ttl;
  }
}
