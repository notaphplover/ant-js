import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';

export interface ISecondaryModelManager<TModel extends IModel, TEntity extends IEntity> {
  /**
   * Model of the manager.
   */
  model: TModel;

  /**
   * Finds an entity by its id.
   * @param id entity's id.
   */
  getById(id: number|string): Promise<TEntity>;

  /**
   * Finds entities by its ids.
   * @param ids Entities ids.
   * @returns Promise of entities found.
   */
  getByIds(ids: Array<number|string>): Promise<TEntity[]>;
}
