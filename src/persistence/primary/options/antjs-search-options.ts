import { AntJsDeleteOptions } from './antjs-delete-options';
import { AntJsUpdateOptions } from './antjs-update-options';
import { CacheMode } from './cache-mode';
import { PersistencySearchOptions } from './persistency-search-options';

export class AntJsSearchOptions implements PersistencySearchOptions {
  /**
   * True if negative cache must be used.
   */
  protected _deleteOptions: AntJsDeleteOptions;

  /**
   * Update options.
   */
  protected _updateOptions: AntJsUpdateOptions;

  /**
   * Creates a new persistency search options.
   * @param deleteOptions Delete options.
   * @param updateOptions Update options.
   */
  public constructor(
    deleteOptions: AntJsDeleteOptions = new AntJsDeleteOptions(),
    updateOptions: AntJsUpdateOptions = new AntJsUpdateOptions(),
  ) {
    this._deleteOptions = deleteOptions;
    this._updateOptions = updateOptions;
  }

  /**
   * @inheritdoc
   */
  public get negativeCache(): boolean {
    return this._deleteOptions.negativeCache;
  }

  /**
   * @inheritdoc
   */
  public get cacheMode(): CacheMode {
    return this._updateOptions.cacheMode;
  }

  /**
   * @inheritdoc
   */
  public get ttl(): number {
    return this._updateOptions.ttl;
  }
}
