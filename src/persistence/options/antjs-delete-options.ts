import { DEFAULT_IGNORE_PRIMARY_LAYER, DEFAULT_IGNORE_SECONDARY_LAYER } from './default-options';
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
   * Creates new AntJS delete options.
   * @param options delete options.
   */
  public constructor(options: Partial<PersistencyDeleteOptions> = {}) {
    this.ignorePrimaryLayer = options.ignorePrimaryLayer ?? DEFAULT_IGNORE_PRIMARY_LAYER;
    this.ignoreSecondaryLayer = options.ignoreSecondaryLayer ?? DEFAULT_IGNORE_SECONDARY_LAYER;
  }
}
