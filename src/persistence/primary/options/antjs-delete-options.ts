import { PersistencyDeleteOptions } from './persistency-delete-options';

export class AntJsDeleteOptions implements PersistencyDeleteOptions {
  /**
   * True to use negative cache.
   */
  protected _negativeCache: boolean;

  /**
   * Creates new AntJS delete options.
   * @param negativeCache True to use negative cache
   */
  public constructor(negativeCache?: boolean) {
    this._negativeCache = negativeCache;
  }

  /**
   * @inheritdoc
   */
  public get negativeCache(): boolean {
    return this._negativeCache;
  }
}
