import { ApiQueriesManagerGeneratorOptions } from './api-queries-manager-generator-options';
import { RedisMiddleware } from '../../../persistence/primary/redis-middleware';

export interface ApiModelManagerGeneratorRedisOptions {
  /**
   * Multipe result query managers options.
   */
  readonly multipleResultQueryManagersOptions?: ApiQueriesManagerGeneratorOptions;
  /**
   * Redis middleware.
   */
  redis?: RedisMiddleware;
  /**
   * Single result query managers options.
   */
  readonly singleResultQueryManagersOptions?: ApiQueriesManagerGeneratorOptions;
  /**
   * Determines if the model manager generated will use negative cache.
   */
  readonly useEntityNegativeCache?: boolean;
}
