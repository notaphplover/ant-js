import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../IModelManager';
import { IEntitySearchOptions } from './IEntitySearchOptions';

/**
 * Represents a manager able to obtain models by ids.
 */
export interface IPrimaryModelManager<TModel extends IModel, TEntity extends IEntity>
  extends IModelManager<TModel, TEntity> {
  /**
   * Model of the manager.
   */
  model: TModel;
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
   * Deletes an entity from the cache.
   * This operation is not propagated to a successor
   * @param entity Entity to delete
   * @returns Promise of entities deleted.
   */
  deleteEntityFromCache(entity: TEntity): Promise<number>;
}
