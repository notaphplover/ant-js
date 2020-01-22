import { Entity } from '../../../model/entity';
import { PersistencySearchOptions } from '../options/persistency-search-options';

export interface QueryManager<TEntity extends Entity, TResult extends TEntity | TEntity[]> {
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(params: any, options: PersistencySearchOptions): Promise<TResult>;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  mGet(paramsArray: any[], options: PersistencySearchOptions): Promise<TEntity[]>;
}
