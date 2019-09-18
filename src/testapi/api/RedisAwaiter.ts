import * as IORedis from 'ioredis';

export class RedisAwaiter {
  /**
   * Redis connection
   */
  protected _redis: IORedis.Redis;

  /**
   * Creates a redis awaiter
   */
  public constructor(redis: IORedis.Redis) {
    this._redis = redis;
  }

  /**
   * Flushes data and scripts from cache.
   */
  public flushDataAndScripts(): Promise<void> {
    return this._redis
      .flushall()
      .then(
        () => this._redis.script(['flush']),
      );
  }
}
