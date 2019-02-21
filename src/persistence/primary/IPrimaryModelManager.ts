import { IModel } from '../../model/IModel';
import { IEntitySearchOptions } from './IEntitySearchOptions';

/**
 * Represents a manager able to obtain models by ids.
 */
export interface IPrimaryModelManager<TModel extends IModel> {
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @returns Model found.
   */
  getById(
    id: number|string,
    searchOptions: IEntitySearchOptions,
  ): Promise<TModel>;

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIds(
    ids: Iterable<number|string>,
    searchOptions: IEntitySearchOptions,
  ): Promise<Iterable<TModel>>;
}
