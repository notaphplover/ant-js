import { CacheMode } from '../options/cache-mode';
import { PersistencyUpdateOptions } from '../options/persistency-update-options';
import { RedisCachedScript } from './redis-cached-script';
import { RedisCachedScriptSet } from './redis-cached-script-set';

export class UpdateEntitiesCachedScriptSet implements RedisCachedScriptSet<PersistencyUpdateOptions> {
  /**
   * Map of keys to redis cached scripts.
   */
  protected _map: Map<CacheMode, [RedisCachedScript, RedisCachedScript]>;

  /**
   * RedisCachedScript generator.
   */
  protected _generator: (mode: PersistencyUpdateOptions) => RedisCachedScript;

  /**
   * Creates a new Redis cached script set by cache mode.
   * @param generator Cached script generator.
   */
  public constructor(generator: (mode: PersistencyUpdateOptions) => RedisCachedScript) {
    this._map = new Map();
    this._generator = generator;
  }

  /**
   * @inheritdoc
   */
  public eval(gArgs: PersistencyUpdateOptions, eArgsGen: (scriptArg: string) => any[]): Promise<any> {
    let scripts = this._map.get(gArgs.cacheMode);
    if (undefined === scripts) {
      scripts = [null, null];
      this._map.set(gArgs.cacheMode, scripts);
    }
    const index = gArgs.ttl ? 1 : 0;
    if (null == scripts[index]) {
      scripts[index] = this._generator(gArgs);
    }
    return scripts[index].eval(eArgsGen);
  }
}
