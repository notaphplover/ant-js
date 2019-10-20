import { IEntity } from '../../model/IEntity';
import { Model } from '../../model/model';

export interface ISecondaryEntityManager<TEntity extends IEntity> {
  /**
   * Model of the manager.
   */
  model: Model;
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @returns Model found.
   */
  getById(id: number | string): Promise<TEntity>;

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIds(ids: number[] | string[]): Promise<TEntity[]>;

  /**
   * Gets a collection of models by its ids ordered by id asc.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIdsOrderedAsc(ids: number[] | string[]): Promise<TEntity[]>;
}
