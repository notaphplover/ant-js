import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ICacheOptions } from './ICacheOptions';

export interface IPrimaryQueryManager<
  TEntity extends IEntity,
  TQueryResult extends Promise<TEntity | TEntity[]>,
> {
  /**
   * Query's model.
   */
  model: IModel;
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(
    params: any,
    searchOptions?: ICacheOptions,
  ): TQueryResult;
  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   * @returns Promise of query sync
   */
  syncDelete(entity: TEntity): Promise<void>;
  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   * @returns Promise of query sync
   */
  syncUpdate(entity: TEntity): Promise<void>;
}
