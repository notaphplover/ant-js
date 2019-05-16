import { IEntity } from '../../model/IEntity';
import { ICacheOptions } from '../../persistence/primary/options/ICacheOptions';
import { IQueryManager } from '../../persistence/primary/query/IQueryManager';
import { IAntQueryManager } from './IAntQueryManager';

export abstract class AntQueryManager<
  TEntity extends IEntity,
  TResult extends TEntity | TEntity[],
> implements IAntQueryManager<TEntity, TResult> {

  /**
   * Inner query manager.
   */
  protected _queryManager: IQueryManager<TEntity, TResult>;

  /**
   * Creates a new Ant Query Manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: IQueryManager<TEntity, TResult>) {
    this._queryManager = queryManager;
  }

  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  public get(
    params: any,
    cacheOptions?: ICacheOptions,
  ): Promise<TResult> {
    return this._queryManager.get(params, cacheOptions);
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param cacheOptions Cache options.
   * @returns Queries results.
   */
  public mGet(
    paramsArray: any[],
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity[]> {
    return this._queryManager.mGet(paramsArray, cacheOptions);
  }
}
