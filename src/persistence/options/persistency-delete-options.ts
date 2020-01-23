import { PersistencyBaseOptions } from './persistency-base-options';

export interface PersistencyDeleteOptions extends PersistencyBaseOptions {
  /**
   * True if negative cache must be used.
   */
  readonly negativeCache: boolean;
}
