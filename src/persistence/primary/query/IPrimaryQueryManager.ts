import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { ICacheOptions } from '../ICacheOptions';

export interface IBasePrimaryQueryManager<
  TEntity extends IEntity,
  TResult extends TEntity | TEntity[],
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
    cacheOptions?: ICacheOptions,
  ): Promise<TResult>;
  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param cacheOptions Cache options.
   * @returns Queries results.
   */
  mGet(
    paramsArray: any[],
    cacheOptions?: ICacheOptions,
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
  extends IBasePrimaryQueryManager<TEntity, TEntity | TEntity[]> {}
