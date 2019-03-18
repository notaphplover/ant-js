import { IEntity } from '../../model/IEntity';
import { IEntityManager } from '../IEntityManager';
import { ICacheOptions } from './ICacheOptions';

/**
 * Represents a manager able to obtain entities by ids.
 */
export interface IPrimaryEntityManager<TEntity extends IEntity>
  extends IEntityManager<TEntity> {
  /**
   * Deletes an entity from the cache.
   * This operation is not propagated to a successor
   * @param entity Entity to delete
   * @returns Promise of entities deleted.
   */
  delete(entity: TEntity): Promise<number>;
  /**
   * Gets the key generation lua script generator.
   * @returns function able to generate a lua expression that generates a key from a giving id.
   */
  getKeyGenerationLuaScriptGenerator(): (alias: string) => string;
  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param searchOptions Search options.
   * @returns Promise of entities cached.
   */
  mUpdate(
    entities: TEntity[],
    searchOptions: ICacheOptions,
  ): Promise<any>;
  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param searchOptions Search options.
   * @returns Promise of redis operation ended
   */
  update(entity: TEntity, searchOptions: ICacheOptions): Promise<any>;
}
