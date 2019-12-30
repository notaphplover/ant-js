import { RedisMiddleware } from '../../persistence/primary/redis-middleware';

export interface ApiModelConfig {
  /**
   * True to perform a negative entity cache strategy.
   */
  readonly negativeCache?: boolean;
  /**
   * Redis connection.
   */
  readonly redis: RedisMiddleware;
}
