import { IEntity } from '../../../model/IEntity';
import { IPersistencyOptions } from '../options/IPersistencyOptions';

export interface IQueryManager<
  TEntity extends IEntity,
  TResult extends TEntity | TEntity[],
> {
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(
    params: any,
    options?: IPersistencyOptions,
  ): Promise<TResult>;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  mGet(
    paramsArray: any[],
    options?: IPersistencyOptions,
  ): Promise<TEntity[]>;
}
