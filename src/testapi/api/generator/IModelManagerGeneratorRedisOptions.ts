import { IRedisMiddleware } from '../../../persistence/primary/IRedisMiddleware';
import { IQueriesManagerGeneratorOptions } from './IQueriesManagerGeneratorOptions';

export interface IModelManagerGeneratorRedisOptions {
  /**
   * Multipe result query managers options.
   */
  multipleResultQueryManagersOptions?: IQueriesManagerGeneratorOptions;
  /**
   * Redis middleware.
   */
  redis?: IRedisMiddleware;
  /**
   * Single result query managers options.
   */
  singleResultQueryManagersOptions?: IQueriesManagerGeneratorOptions;
  /**
   * Determines if the model manager generated will use negative cache.
   */
  useEntityNegativeCache?: boolean;
}
