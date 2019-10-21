import { RedisMiddleware } from '../../../persistence/primary/redis-middleware';
import { IQueriesManagerGeneratorOptions } from './IQueriesManagerGeneratorOptions';

export interface IModelManagerGeneratorRedisOptions {
  /**
   * Multipe result query managers options.
   */
  multipleResultQueryManagersOptions?: IQueriesManagerGeneratorOptions;
  /**
   * Redis middleware.
   */
  redis?: RedisMiddleware;
  /**
   * Single result query managers options.
   */
  singleResultQueryManagersOptions?: IQueriesManagerGeneratorOptions;
  /**
   * Determines if the model manager generated will use negative cache.
   */
  useEntityNegativeCache?: boolean;
}
