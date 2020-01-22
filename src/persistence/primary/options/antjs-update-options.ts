import {
  DEFAULT_CACHE_MODE_OPTION,
  DEFAULT_IGNORE_PRIMARY_LAYER,
  DEFAULT_IGNORE_SECONDARY_LAYER,
  DEFAULT_TTL_OPTION,
} from './default-options';
import { CacheMode } from './cache-mode';
import { PersistencyUpdateOptions } from './persistency-update-options';

export class AntJsUpdateOptions implements PersistencyUpdateOptions {
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
   * Creates a new entity search options.
   * @param options Update options.
   */
  public constructor(options: Partial<PersistencyUpdateOptions> = {}) {
    this.cacheMode = options.cacheMode ?? DEFAULT_CACHE_MODE_OPTION;
    this.ignorePrimaryLayer = options.ignorePrimaryLayer ?? DEFAULT_IGNORE_PRIMARY_LAYER;
    this.ignoreSecondaryLayer = options.ignoreSecondaryLayer ?? DEFAULT_IGNORE_SECONDARY_LAYER;
    this.ttl = options.ttl ?? DEFAULT_TTL_OPTION;
  }
}
