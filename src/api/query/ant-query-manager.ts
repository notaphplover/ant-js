import { Entity } from '../../model/entity';
import { IPersistencySearchOptions } from '../../persistence/primary/options/IPersistencySearchOptions';
import { QueryManager } from '../../persistence/primary/query/query-manager';
import { ApiQueryManager } from './api-query-manager';

export abstract class AntQueryManager<TEntity extends Entity, TResult extends TEntity | TEntity[]>
  implements ApiQueryManager<TEntity, TResult> {
  /**
   * Inner query manager.
   */
  protected _queryManager: QueryManager<TEntity, TResult>;

  /**
   * Creates a new Ant Query Manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: QueryManager<TEntity, TResult>) {
    this._queryManager = queryManager;
  }

  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  public get(params: any, options?: IPersistencySearchOptions): Promise<TResult> {
    return this._queryManager.get(params, options);
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  public mGet(paramsArray: any[], options?: IPersistencySearchOptions): Promise<TEntity[]> {
    return this._queryManager.mGet(paramsArray, options);
  }
}
