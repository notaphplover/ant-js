import {IEntity} from '../../model/IEntity';
import { IEntitySearchOptions } from './IEntitySearchOptions';

export interface IPrimaryQueryManager<TEntity extends IEntity> {
  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param searchOptions Search options.
   * @returns Promise of entities cached.
   */
  cacheEntities(
    entities: TEntity[],
    searchOptions: IEntitySearchOptions,
  ): Promise<any>;
  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param searchOptions Search options.
   * @returns Promise of redis operation ended
   */
  cacheEntity(entity: TEntity, searchOptions: IEntitySearchOptions): Promise<any>;
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
