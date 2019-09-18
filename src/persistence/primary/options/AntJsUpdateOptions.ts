import { CacheMode } from './CacheMode';
import { IPersistencyUpdateOptions } from './IPersistencyUpdateOptions';

export class AntJsUpdateOptions implements IPersistencyUpdateOptions {
  /**
   * Cache options.
   */
  protected _cacheMode: CacheMode;
  /**
   * TTL of the entity (in milliseconds). A null value represents no TTL.
   */
  protected _ttl?: number;

  /**
   * Creates a new entity search options.
   * @param cacheMode Cache options.
   * @param ttl TTL of the entity. A null value represents no TTL.
   */
  public constructor(
    cacheMode: CacheMode = CacheMode.CacheAndOverwrite,
    ttl: number = null,
  ) {
    this._cacheMode = cacheMode;
    this._ttl = ttl;
  }

  /**
   * Cache options.
   */
  public get cacheMode(): CacheMode {
    return this._cacheMode;
  }

  /**
   * TTL of the entity. A null value represents no TTL.
   */
  public get ttl(): number {
    return this._ttl;
  }
}
