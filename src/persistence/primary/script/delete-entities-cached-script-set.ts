import { PersistencyDeleteOptions } from '../options/persistency-delete-options';
import { IRedisCachedScriptSet } from './IRedisCachedScriptSet';
import { RedisCachedScript } from './redis-cached-script';

export class DeleteEntitiesCachedScriptSet implements IRedisCachedScriptSet<PersistencyDeleteOptions> {
  /**
   * Map of keys to redis cached scripts.
   */
  protected _scripts: [RedisCachedScript, RedisCachedScript];

  /**
   * RedisCachedScript generator.
   */
  protected _generator: (mode: PersistencyDeleteOptions) => RedisCachedScript;

  /**
   * Creates a new Redis cached script set by cache mode.
   * @param generator Cached script generator.
   */
  public constructor(generator: (mode: PersistencyDeleteOptions) => RedisCachedScript) {
    this._scripts = [null, null];
    this._generator = generator;
  }

  /**
   * @inheritdoc
   */
  public eval(gArgs: PersistencyDeleteOptions, eArgsGen: (scriptArg: string) => any[]): Promise<any> {
    const index = gArgs.negativeCache ? 1 : 0;
    if (null == this._scripts[index]) {
      this._scripts[index] = this._generator(gArgs);
    }
    return this._scripts[index].eval(eArgsGen);
  }
}
