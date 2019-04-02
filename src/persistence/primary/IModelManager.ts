import { IEntity } from '../../model/IEntity';
import { ICacheOptions } from './ICacheOptions';

export interface IModelManager<TEntity extends IEntity> {
  /**
   * Deletes an entity from the cache layer.
   * @param entity Entity to delete.
   * @returns Promise of entity deleted.
   */
  delete(entity: TEntity): Promise<any>;
  /**
   * Finds an entity by its id.
   * @param id Id of the entity.
   * @param cacheOptions Cache options.
   * @returns Entity found
   */
  get(id: number|string, cacheOptions?: ICacheOptions): Promise<TEntity>;
  /**
   * Deletes multiple entities from the cache layer.
   * @param entities Entities to delete.
   * @returns Promise of entities deleted.
   */
  mDelete(entities: TEntity[]): Promise<any>;
  /**
   * Finds a collection if entities by its ids.
   * @param ids Ids of the entities.
   * @param cacheOptions Cache options.
   * @returns Entities found.
   */
  mGet(ids: number[]|string[], cacheOptions?: ICacheOptions): Promise<TEntity[]>;
  /**
   * Updates multiple entities at the cache layer.
   * @param entities Entities to be updated.
   * @param cacheOptions Cache options.
   * @returns Priomise of entities updated.
   */
  mUpdate(
    entities: TEntity[],
    cacheOptions?: ICacheOptions,
  ): Promise<any>;
  /**
   * Updates an entity at the cache layer.
   * @param entity Entitty to update.
   * @param cacheOptions Cache options.
   * @returns Promise of entity updated.
   */
  update(
    entity: TEntity,
    cacheOptions?: ICacheOptions,
  ): Promise<any>;
}
