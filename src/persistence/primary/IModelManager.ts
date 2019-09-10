import { IEntity } from '../../model/IEntity';
import { IPrimaryEntityManager, IPrimaryEntityManagerBase } from './IPrimaryEntityManager';
import { ICacheOptions } from './options/ICacheOptions';
import { IPrimaryQueryManager } from './query/IPrimaryQueryManager';

export interface IBaseModelManager<TEntity extends IEntity>
  extends IPrimaryEntityManagerBase<TEntity> {
  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @returns Promise of entity deleted.
   */
  delete(id: number|string): Promise<any>;
  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @returns Promise of entities deleted.
   */
  mDelete(ids: number[]|string[]): Promise<any>;
  /**
   * Updates multiple entities at the cache layer.
   * @param entities Entities to be updated.
   * @param options Cache options.
   * @returns Priomise of entities updated.
   */
  mUpdate(entities: TEntity[], options?: ICacheOptions): Promise<any>;
  /**
   * Updates an entity at the cache layer.
   * @param entity Entitty to update.
   * @param options Cache options.
   * @returns Promise of entity updated.
   */
  update(entity: TEntity, options?: ICacheOptions): Promise<any>;
}

export interface IModelManager<TEntity extends IEntity>
  extends IBaseModelManager<TEntity>, IPrimaryEntityManager<TEntity> {
  /**
   * Adds a query manager to the model manager.
   * @param queryManager Query manager to add.
   */
  addQuery(queryManager: IPrimaryQueryManager<TEntity>): this;

  /**
   * Returns the queries managed.
   * @returns Queries managed.
   */
  getQueries(): Array<IPrimaryQueryManager<TEntity>>;
}
