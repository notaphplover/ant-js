import { CacheMode } from '../options/CacheMode';
import { IPersistencyOptions } from '../options/IPersistencyOptions';
import { IRedisCachedScriptSet } from './IRedisCachedScriptSet';
import { RedisCachedScript } from './RedisCachedScript';

export class RedisCachedScriptSetByCacheMode implements IRedisCachedScriptSet<IPersistencyOptions> {
  /**
   * Map of keys to redis cached scripts.
   */
  protected _map: Map<CacheMode, [RedisCachedScript, RedisCachedScript]>;

  /**
   * RedisCachedScript generator.
   */
  protected _generator: (mode: IPersistencyOptions) => RedisCachedScript;

  /**
   * Creates a new Redis cached script set by cache mode.
   * @param generator Cached script generator.
   */
  public constructor(generator: (mode: IPersistencyOptions) => RedisCachedScript) {
    this._map = new Map();
    this._generator = generator;
  }

  /**
   * @inheritdoc
   */
  public eval(gArgs: IPersistencyOptions, eArgsGen: (scriptArg: string) => any[]): Promise<any> {
    let scripts = this._map.get(gArgs.cacheMode);
    if (undefined === scripts) {
      scripts = [null, null];
      this._map.set(gArgs.cacheMode, scripts);
    }
    const index = gArgs.ttl ? 1 : 0;
    if (null == scripts[index]) {
      scripts[index] = this.generateCachedScript(gArgs);
    }
    return scripts[index].eval(eArgsGen);
  }

  /**
   * @inheritdoc
   */
  protected generateCachedScript(options: IPersistencyOptions): RedisCachedScript {
    return this._generator(options);
  }
}
