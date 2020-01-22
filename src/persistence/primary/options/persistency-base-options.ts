export interface PersistencyBaseOptions {
  /**
   * Ignores the primary layer when performing the current operation.
   */
  readonly ignorePrimaryLayer: boolean;
  /**
   * Ignores the secondary layer when performing the current operation.
   */
  readonly ignoreSecondaryLayer: boolean;
}
