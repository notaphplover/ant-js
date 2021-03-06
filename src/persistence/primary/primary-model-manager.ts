import { PrimaryEntityManager, PrimaryEntityManagerBase } from './primary-entity-manager';
import { Entity } from '../../model/entity';
import { PersistencyDeleteOptions } from './options/persistency-delete-options';
import { PersistencyUpdateOptions } from './options/persistency-update-options';
import { PrimaryQueryManager } from './query/primary-query-manager';

export interface BasePrimaryModelManager<TEntity extends Entity> extends PrimaryEntityManagerBase<TEntity> {
  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @param options Delete options.
   * @returns Promise of entity deleted.
   */
  delete(id: number | string, options?: PersistencyDeleteOptions): Promise<any>;
  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @param options Delete options.
   * @returns Promise of entities deleted.
   */
  mDelete(ids: number[] | string[], options?: PersistencyDeleteOptions): Promise<any>;
  /**
   * Updates multiple entities at the cache layer.
   * @param entities Entities to be updated.
   * @param options Cache options.
   * @returns Priomise of entities updated.
   */
  mUpdate(entities: TEntity[], options?: PersistencyUpdateOptions): Promise<any>;
  /**
   * Updates an entity at the cache layer.
   * @param entity Entitty to update.
   * @param options Cache options.
   * @returns Promise of entity updated.
   */
  update(entity: TEntity, options?: PersistencyUpdateOptions): Promise<any>;
}

export interface PrimaryModelManager<TEntity extends Entity>
  extends BasePrimaryModelManager<TEntity>,
    PrimaryEntityManager<TEntity> {
  /**
   * Adds a query manager to the model manager.
   * @param queryManager Query manager to add.
   */
  addQuery(queryManager: PrimaryQueryManager<TEntity>): this;

  /**
   * Returns the queries managed.
   * @returns Queries managed.
   */
  getQueries(): Array<PrimaryQueryManager<TEntity>>;
}
