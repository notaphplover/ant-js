import { CacheMode } from '../options/CacheMode';
import { IPersistencyUpdateOptions } from '../options/IPersistencyUpdateOptions';
import { IRedisCachedScriptSet } from './IRedisCachedScriptSet';
import { RedisCachedScript } from './RedisCachedScript';

export class RedisCachedScriptSetByCacheMode implements IRedisCachedScriptSet<IPersistencyUpdateOptions> {
  /**
   * Map of keys to redis cached scripts.
   */
  protected _map: Map<CacheMode, [RedisCachedScript, RedisCachedScript]>;

  /**
   * RedisCachedScript generator.
   */
  protected _generator: (mode: IPersistencyUpdateOptions) => RedisCachedScript;

  /**
   * Creates a new Redis cached script set by cache mode.
   * @param generator Cached script generator.
   */
  public constructor(generator: (mode: IPersistencyUpdateOptions) => RedisCachedScript) {
    this._map = new Map();
    this._generator = generator;
  }

  /**
   * @inheritdoc
   */
  public eval(gArgs: IPersistencyUpdateOptions, eArgsGen: (scriptArg: string) => any[]): Promise<any> {
    let scripts = this._map.get(gArgs.cacheMode);
    if (undefined === scripts) {
      scripts = [null, null];
      this._map.set(gArgs.cacheMode, scripts);
    }
    const index = gArgs.ttl ? 1 : 0;
    if (null == scripts[index]) {
      scripts[index] = this._generateCachedScript(gArgs);
    }
    return scripts[index].eval(eArgsGen);
  }

  /**
   * @inheritdoc
   */
  protected _generateCachedScript(options: IPersistencyUpdateOptions): RedisCachedScript {
    return this._generator(options);
  }
}
