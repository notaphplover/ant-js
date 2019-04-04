import { IEntity } from '../model/IEntity';
import { IModel } from '../model/IModel';
import { ICacheOptions } from './primary/options/ICacheOptions';

export interface IEntityManager<TEntity extends IEntity> {
  /**
   * Model of the manager.
   */
  model: IModel;
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @param cacheOptions Cache options.
   * @returns Model found.
   */
  getById(
    id: number|string,
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity>;

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param cacheOptions Cache options.
   * @returns Models found.
   */
  getByIds(
    ids: number[]| string[],
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity[]>;
}
