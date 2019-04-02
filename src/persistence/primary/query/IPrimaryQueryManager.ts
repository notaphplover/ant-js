import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { ICacheOptions } from '../ICacheOptions';

export interface IBasePrimaryQueryManager<
  TEntity extends IEntity,
  TResult extends Promise<TEntity | TEntity[]>,
> {
  /**
   * Query's model.
   */
  model: IModel;
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(
    params: any,
    searchOptions?: ICacheOptions,
  ): TResult;
  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param searchOptions Search options.
   * @returns Queries results.
   */
  mGet(
    paramsArray: any[],
    searchOptions?: ICacheOptions,
  ): Promise<TEntity[]>;
  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   * @returns Promise of query sync
   */
  syncDelete(entity: TEntity): Promise<void>;
  /**
   * Syncs the remove of entities in cache.
   * @param entities deleted entities.
   * @returns Promise of query sync
   */
  syncMDelete(entities: TEntity[]): Promise<void>;
  /**
   * Syncs the update of multiple entities.
   * @param entities updated entities.
   * @returns Promise of query sync
   */
  syncMUpdate(entities: TEntity[]): Promise<void>;
  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   * @returns Promise of query sync
   */
  syncUpdate(entity: TEntity): Promise<void>;
}

export interface IPrimaryQueryManager<TEntity extends IEntity>
  extends IBasePrimaryQueryManager<TEntity, Promise<TEntity | TEntity[]>> {}
