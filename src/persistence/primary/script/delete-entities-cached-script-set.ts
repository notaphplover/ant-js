import { RedisCachedScript } from './redis-cached-script';
import { RedisCachedScriptSet } from './redis-cached-script-set';

export class DeleteEntitiesCachedScriptSet implements RedisCachedScriptSet<boolean> {
  /**
   * Map of keys to redis cached scripts.
   */
  protected _scripts: [RedisCachedScript, RedisCachedScript];

  /**
   * RedisCachedScript generator.
   */
  protected _generator: (negativeCache: boolean) => RedisCachedScript;

  /**
   * Creates a new Redis cached script set by cache mode.
   * @param generator Cached script generator.
   */
  public constructor(generator: (negativeCache: boolean) => RedisCachedScript) {
    this._scripts = [null, null];
    this._generator = generator;
  }

  /**
   * @inheritdoc
   */
  public eval(negativeCache: boolean, eArgsGen: (scriptArg: string) => any[]): Promise<any> {
    const index = negativeCache ? 1 : 0;
    if (null == this._scripts[index]) {
      this._scripts[index] = this._generator(negativeCache);
    }
    return this._scripts[index].eval(eArgsGen);
  }
}
