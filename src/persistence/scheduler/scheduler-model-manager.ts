import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PersistencyDeleteOptions } from '../primary/options/persistency-delete-options';
import { PersistencySearchOptions } from '../primary/options/persistency-search-options';
import { PrimaryQueryManager } from '../primary/query/primary-query-manager';

export interface SchedulerModelManagerBase<TEntity> {
  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @param options Delete options.
   * @returns Promise of entity deleted.
   */
  delete(id: number | string, options?: PersistencyDeleteOptions): Promise<any>;
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @param options Cache options.
   * @returns Model found.
   */
  get(id: number | string, options?: PersistencySearchOptions): Promise<TEntity>;
  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @param options Delete options.
   * @returns Promise of entities deleted.
   */
  mDelete(ids: number[] | string[], options?: PersistencyDeleteOptions): Promise<any>;
  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param options Cache options.
   * @returns Models found.
   */
  mGet(ids: number[] | string[], options?: PersistencySearchOptions): Promise<TEntity[]>;
}

export interface SchedulerModelManager<TEntity extends Entity, TModel extends Model<TEntity>>
  extends SchedulerModelManagerBase<TEntity> {
  /**
   * Model of the manager.
   */
  readonly model: TModel;
  /**
   * Adds a query manager to the model manager.
   * @param queryManager Query manager to add.
   */
  addQuery(queryManager: PrimaryQueryManager<TEntity>): this;
}
