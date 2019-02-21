import { CacheOptions } from './CacheOptions';
import { IEntitySearchOptions } from './IEntitySearchOptions';

export class EntitySearchOptions implements IEntitySearchOptions {
  /**
   * Cache options.
   */
  protected _cacheOptions: CacheOptions;
  /**
   * TTL of the entity. A null value represents no TTL.
   */
  protected _ttl?: number;

  /**
   * Creates a new entity search options.
   * @param cacheOptions Cache options.
   * @param ttl TTL of the entity. A null value represents no TTL.
   */
  public constructor(
    cacheOptions: CacheOptions = CacheOptions.CacheAndOverwrite,
    ttl: number = null,
  ) {
    this._cacheOptions = cacheOptions;
    this._ttl = ttl;
  }

  /**
   * Cache options.
   */
  public get cacheOptions(): CacheOptions {
    return this._cacheOptions;
  }

  /**
   * TTL of the entity. A null value represents no TTL.
   */
  public get ttl(): number {
    return this.ttl;
  }
}
