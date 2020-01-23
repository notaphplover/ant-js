import { Entity } from '../../model/entity';
import { PersistencySearchOptions } from '../../persistence/options/persistency-search-options';

export interface ApiQueryManager<TEntity extends Entity, TResult extends TEntity | TEntity[]> {
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(params: any, options?: Partial<PersistencySearchOptions>): Promise<TResult>;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  mGet(paramsArray: any[], options?: Partial<PersistencySearchOptions>): Promise<TEntity[]>;
}
