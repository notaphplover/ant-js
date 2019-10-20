import { IEntity } from '../../model/IEntity';
import { Model } from '../../model/model';
import { IPersistencySearchOptions } from './options/IPersistencySearchOptions';

export interface IPrimaryEntityManagerBase<TEntity extends IEntity> {
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @param options Cache options.
   * @returns Model found.
   */
  get(id: number | string, options?: IPersistencySearchOptions): Promise<TEntity>;
  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param options Cache options.
   * @returns Models found.
   */
  mGet(ids: number[] | string[], options?: IPersistencySearchOptions): Promise<TEntity[]>;
}

/**
 * Represents a manager able to obtain entities by ids.
 */
export interface IPrimaryEntityManager<TEntity extends IEntity> extends IPrimaryEntityManagerBase<TEntity> {
  /**
   * Model of the manager.
   */
  model: Model;

  /**
   * Gets the lua key generator from id.
   * @returns Lua key generator
   */
  getLuaKeyGeneratorFromId(): (alias: string) => string;
}
