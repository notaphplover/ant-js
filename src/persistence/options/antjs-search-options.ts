import {
  DEFAULT_CACHE_MODE_OPTION,
  DEFAULT_IGNORE_PRIMARY_LAYER,
  DEFAULT_IGNORE_SECONDARY_LAYER,
  DEFAULT_TTL_OPTION,
} from './default-options';
import { CacheMode } from './cache-mode';
import { PersistencySearchOptions } from './persistency-search-options';

export class AntJsSearchOptions implements PersistencySearchOptions {
  /**
   * @inheritdoc
   */
  public readonly cacheMode: CacheMode;
  /**
   * @inheritdoc
   */
  public readonly ignorePrimaryLayer: boolean;
  /**
   * @inheritdoc
   */
  public readonly ignoreSecondaryLayer: boolean;
  /**
   * @inheritdoc
   */
  public readonly ttl: number;

  /**
   * Creates a new persistency search options.
   * @param deleteOptions Delete options.
   * @param updateOptions Update options.
   */
  public constructor(options: Partial<PersistencySearchOptions> = {}) {
    this.cacheMode = options.cacheMode ?? DEFAULT_CACHE_MODE_OPTION;
    this.ignorePrimaryLayer = options.ignorePrimaryLayer ?? DEFAULT_IGNORE_PRIMARY_LAYER;
    this.ignoreSecondaryLayer = options.ignoreSecondaryLayer ?? DEFAULT_IGNORE_SECONDARY_LAYER;
    this.ttl = options.ttl ?? DEFAULT_TTL_OPTION;
  }
}
