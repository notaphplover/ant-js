import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IEntitySearchOptions } from './IEntitySearchOptions';

/**
 * Represents a manager able to obtain models by ids.
 */
export interface IPrimaryModelManager<TModel extends IModel, TEntity extends IEntity> {
  /**
   * Model of the manager.
   */
  model: TModel;
  /**
   * Deletes an entity from the cache.
   * This operation is not propagated to a successor
   * @param entity Entity to delete
   * @returns Promise of entities deleted.
   */
  deleteEntityFromCache(entity: TEntity): Promise<number>;
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @returns Model found.
   */
  getById(
    id: number|string,
    searchOptions: IEntitySearchOptions,
  ): Promise<TEntity>;

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIds(
    ids: Iterable<number|string>,
    searchOptions: IEntitySearchOptions,
  ): Promise<TEntity[]>;
}
