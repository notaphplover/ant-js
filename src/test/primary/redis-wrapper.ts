import * as IORedis from 'ioredis';

const REDIS_PORT = 6379;
const REDIS_HOST = 'ant_redis';
const REDIS_DB = 0;

const redisConnection = new IORedis({
  db: REDIS_DB,
  host: REDIS_HOST,
  port: REDIS_PORT,
});

export class RedisWrapper {
  /**
   * Redis instance
   */
  protected _redis: IORedis.Redis;

  /**
   * Creates a new RedisWrapper.
   */
  public constructor() {
    this._redis = redisConnection;
  }

  /**
   * Redis instance
   */
  public get redis(): IORedis.Redis {
    return this._redis;
  }
}
