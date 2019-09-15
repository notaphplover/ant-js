import { IPersistencyDeleteOptions } from './IPersistencyDeleteOptions';

export class AntJsDeleteOptions implements IPersistencyDeleteOptions {
  /**
   * True to use negative cache.
   */
  protected _negativeCache: boolean;

  /**
   * Creates new AntJS delete options.
   * @param negativeCache True to use negative cache
   */
  public constructor(negativeCache: boolean = true) {
    this._negativeCache = negativeCache;
  }

  /**
   * @inheritdoc
   */
  public get negativeCache(): boolean {
    return this._negativeCache;
  }
}
