import {IEntity} from '../../model/IEntity';
import { IEntitySearchOptions } from './IEntitySearchOptions';

export interface IPrimaryQueryManager<
  TEntity extends IEntity,
  TQueryResult extends Promise<TEntity | TEntity[]>,
> {
  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   * @returns Promise of query sinc
   */
  deleteEntityInQueries(entity: TEntity): Promise<void>;
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(
    params: any,
    searchOptions?: IEntitySearchOptions,
  ): TQueryResult;
  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   */
  updateEntityInQueries(entity: TEntity): Promise<void>;
}
