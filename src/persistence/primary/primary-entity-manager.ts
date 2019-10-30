import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PersistencySearchOptions } from './options/persistency-search-options';

export interface PrimaryEntityManagerBase<TEntity extends Entity> {
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @param options Cache options.
   * @returns Model found.
   */
  get(id: number | string, options?: PersistencySearchOptions): Promise<TEntity>;
  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param options Cache options.
   * @returns Models found.
   */
  mGet(ids: number[] | string[], options?: PersistencySearchOptions): Promise<TEntity[]>;
}

/**
 * Represents a manager able to obtain entities by ids.
 */
export interface PrimaryEntityManager<TEntity extends Entity> extends PrimaryEntityManagerBase<TEntity> {
  /**
   * Model of the manager.
   */
  model: Model<TEntity>;

  /**
   * Gets the lua key generator from id.
   * @returns Lua key generator
   */
  getLuaKeyGeneratorFromId(): (alias: string) => string;
}
