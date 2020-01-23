import { Entity } from '../../model/entity';
import { PersistencySearchOptions } from '../options/persistency-search-options';

export interface PrimaryEntityManager<TEntity extends Entity> {
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @param options Cache options.
   * @returns Model found.
   */
  get(id: number | string, options: PersistencySearchOptions): Promise<TEntity>;
  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param options Cache options.
   * @returns Models found.
   */
  mGet(ids: number[] | string[], options: PersistencySearchOptions): Promise<TEntity[]>;
}
