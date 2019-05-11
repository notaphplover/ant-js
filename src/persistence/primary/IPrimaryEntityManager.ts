import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ICacheOptions } from './options/ICacheOptions';

/**
 * Represents a manager able to obtain entities by ids.
 */
export interface IPrimaryEntityManager<TEntity extends IEntity> {
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
  /**
   * Gets the key generation lua script generator.
   * @returns function able to generate a lua expression that generates a key from a giving id.
   */
  getKeyGenerationLuaScriptGenerator(): (alias: string) => string;
}
