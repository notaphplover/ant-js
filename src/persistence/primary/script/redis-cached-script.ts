import * as crypto from 'crypto';
import { RedisMiddleware } from '../redis-middleware';

/**
 * Redis cached script manager. Inspirated in the code of the ioredis library:
 *
 * https://github.com/luin/ioredis/blob/master/lib/script.ts
 */
export class RedisCachedScript {
  /**
   * Lua script.
   */
  protected _lua: string;
  /**
   * Redis manager.
   */
  protected _redis: RedisMiddleware;
  /**
   * SHA1 string of the lua script in order to use EVALSHA.
   */
  protected _sha: string;

  /**
   * Creates a new Redis cached script.
   * @param lua Lua script.
   * @param redis Redis manager.
   */
  public constructor(lua: string, redis: RedisMiddleware) {
    this._redis = redis;
    this._lua = lua;
    this._sha = crypto
      .createHash('sha1')
      .update(lua)
      .digest('hex');
  }

  /**
   * Evaluates the script in the server.
   * @param args Script args ([number of keys, ...KEYS, ...ARGV]).
   */
  public eval(argsGen: (scriptArg: string) => any[]): Promise<any> {
    return (this._redis.evalsha(argsGen(this._sha)) as Promise<any>).catch((err) => {
      // See https://redis.io/commands/eval
      if (err.toString().indexOf('NOSCRIPT') === -1) {
        throw err;
      }
      return this._redis.eval(argsGen(this._lua));
    });
  }
}
