import { IEntity } from '../model/IEntity';
import { IModel } from '../model/IModel';
import { IEntitySearchOptions } from './primary/IEntitySearchOptions';

export interface IModelManager<TModel extends IModel, TEntity extends IEntity> {
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @returns Model found.
   */
  getById(
    id: number|string,
    searchOptions?: IEntitySearchOptions,
  ): Promise<TEntity>;

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIds(
    ids: Iterable<number|string>,
    searchOptions?: IEntitySearchOptions,
  ): Promise<TEntity[]>;
}
