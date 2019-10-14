import { IEntity } from '../../../model/IEntity';
import { IPersistencyUpdateOptions } from '../options/IPersistencyUpdateOptions';

export interface IQueryManager<TEntity extends IEntity, TResult extends TEntity | TEntity[]> {
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(params: any, options?: IPersistencyUpdateOptions): Promise<TResult>;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  mGet(paramsArray: any[], options?: IPersistencyUpdateOptions): Promise<TEntity[]>;
}
