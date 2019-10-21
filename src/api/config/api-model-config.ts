import { RedisMiddleware } from '../../persistence/primary/redis-middleware';

export interface ApiModelConfig {
  /**
   * True to perform a negative entity cache strategy.
   */
  negativeCache?: boolean;
  /**
   * Redis connection.
   */
  redis: RedisMiddleware;
}
