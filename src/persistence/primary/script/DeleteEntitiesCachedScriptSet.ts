import { IPersistencyDeleteOptions } from '../options/IPersistencyDeleteOptions';
import { IRedisCachedScriptSet } from './IRedisCachedScriptSet';
import { RedisCachedScript } from './RedisCachedScript';

export class DeleteEntitiesCachedScriptSet implements IRedisCachedScriptSet<IPersistencyDeleteOptions> {
  /**
   * Map of keys to redis cached scripts.
   */
  protected _scripts: [RedisCachedScript, RedisCachedScript];

  /**
   * RedisCachedScript generator.
   */
  protected _generator: (mode: IPersistencyDeleteOptions) => RedisCachedScript;

  /**
   * Creates a new Redis cached script set by cache mode.
   * @param generator Cached script generator.
   */
  public constructor(generator: (mode: IPersistencyDeleteOptions) => RedisCachedScript) {
    this._scripts = [null, null];
    this._generator = generator;
  }

  /**
   * @inheritdoc
   */
  public eval(gArgs: IPersistencyDeleteOptions, eArgsGen: (scriptArg: string) => any[]): Promise<any> {
    const index = gArgs.negativeCache ? 1 : 0;
    if (null == this._scripts[index]) {
      this._scripts[index] = this._generator(gArgs);
    }
    return this._scripts[index].eval(eArgsGen);
  }
}
