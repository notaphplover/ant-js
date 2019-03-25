import { IEntity } from '../../model/IEntity';
import { ICacheOptions } from '../../persistence/primary/ICacheOptions';

export interface IModelManager<TEntity extends IEntity> {
  /**
   * Deletes an entity from the cache layer.
   * @param entity Entity to delete.
   * @returns Promise of entity deleted.
   */
  delete(entity: TEntity): Promise<any>;
  /**
   * Deletes multiple entities from the cache layer.
   * @param entities Entities to delete.
   * @returns Promise of entities deleted.
   */
  mDelete(entities: TEntity[]): Promise<any>;
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
