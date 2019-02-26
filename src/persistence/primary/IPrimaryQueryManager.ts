import {IEntity} from '../../model/IEntity';

export interface IPrimaryQueryManager<TEntity extends IEntity> {
  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   */
  deleteEntityInQueries(entity: TEntity): void;
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(params: any): TEntity | TEntity[];
  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   */
  updateEntityInQueries(entity: TEntity): void;
}
