import { ApiQueryManager } from './api-query-manager';
import { Entity } from '../../model/entity';
import { PersistencySearchOptions } from '../../persistence/primary/options/persistency-search-options';
import { QueryManager } from '../../persistence/primary/query/query-manager';

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
  public get(params: any, options?: PersistencySearchOptions): Promise<TResult> {
    return this._queryManager.get(params, options);
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  public mGet(paramsArray: any[], options?: PersistencySearchOptions): Promise<TEntity[]> {
    return this._queryManager.mGet(paramsArray, options);
  }
}
