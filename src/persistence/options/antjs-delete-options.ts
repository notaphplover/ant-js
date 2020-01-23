import {
  DEFAULT_IGNORE_PRIMARY_LAYER,
  DEFAULT_IGNORE_SECONDARY_LAYER,
  DEFAULT_NEGATIVE_CACHE_OPTION,
} from './default-options';
import { PersistencyDeleteOptions } from './persistency-delete-options';

export class AntJsDeleteOptions implements PersistencyDeleteOptions {
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
  public readonly negativeCache: boolean;

  /**
   * Creates new AntJS delete options.
   * @param options delete options.
   */
  public constructor(options: Partial<PersistencyDeleteOptions> = {}) {
    this.ignorePrimaryLayer = options.ignorePrimaryLayer ?? DEFAULT_IGNORE_PRIMARY_LAYER;
    this.ignoreSecondaryLayer = options.ignoreSecondaryLayer ?? DEFAULT_IGNORE_SECONDARY_LAYER;
    this.negativeCache = options.negativeCache ?? DEFAULT_NEGATIVE_CACHE_OPTION;
  }
}
