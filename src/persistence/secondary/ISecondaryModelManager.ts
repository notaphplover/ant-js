import { IModel } from '../../model/IModel';

export interface ISecondaryModelManager<TModel extends IModel> {
  /**
   * Finds an entity by its id.
   * @param id entity's id.
   */
  getById(id: number|string): Promise<TModel>;

  /**
   * Finds entities by its ids.
   * @param ids Entities ids.
   * @returns Promise of entities found.
   */
  getByIds(ids: Iterable<number|string>): Promise<Iterable<TModel>>;
}
