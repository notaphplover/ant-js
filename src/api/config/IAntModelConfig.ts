import * as IORedis from 'ioredis';

export interface IAntModelConfig {
  /**
   * Redis connection.
   */
  redis: IORedis.Redis;
}
