import { Entity } from '../../model/entity';
import { Model } from '../../model/model';

export interface SecondaryEntityManager<TEntity extends Entity> {
  /**
   * Model of the manager.
   */
  readonly model: Model<TEntity>;
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
