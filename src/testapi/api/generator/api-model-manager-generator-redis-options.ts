import { RedisMiddleware } from '../../../persistence/primary/redis-middleware';
import { ApiQueriesManagerGeneratorOptions } from './api-queries-manager-generator-options';

export interface ApiModelManagerGeneratorRedisOptions {
  /**
   * Multipe result query managers options.
   */
  multipleResultQueryManagersOptions?: ApiQueriesManagerGeneratorOptions;
  /**
   * Redis middleware.
   */
  redis?: RedisMiddleware;
  /**
   * Single result query managers options.
   */
  singleResultQueryManagersOptions?: ApiQueriesManagerGeneratorOptions;
  /**
   * Determines if the model manager generated will use negative cache.
   */
  useEntityNegativeCache?: boolean;
}
