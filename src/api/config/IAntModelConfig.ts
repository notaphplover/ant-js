import { IRedisMiddleware } from '../../persistence/primary/IRedisMiddleware';

export interface IAntModelConfig {
  /**
   * True to perform a negative entity cache strategy.
   */
  negativeCache?: boolean;
  /**
   * Redis connection.
   */
  redis: IRedisMiddleware;
}
