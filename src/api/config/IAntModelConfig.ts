import * as IORedis from 'ioredis';

export interface IAntModelConfig {
  /**
   * True to perform a negative entity cache strategy.
   */
  negativeCache?: boolean;
  /**
   * Redis connection.
   */
  redis: IORedis.Redis;
}
