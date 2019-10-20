import { Entity } from '../model/entity';
import { IBaseModelManager } from '../persistence/primary/IModelManager';
import { MultipleQueryResult, QueryResult, SingleQueryResult } from '../persistence/primary/query/primary-query-manager';
import { ApiModelConfig } from './config/api-model-config';
import { ApiQueryConfig } from './config/api-query-config';
import { ApiMultipleResultQueryManager } from './query/api-multiple-result-query-manager';
import { ApiQueryManager } from './query/api-query-manager';
import { ApiSingleResultQueryManager } from './query/api-single-result-query-manager';

export type TAntQueryManager<TEntity, TQueryResult> = TQueryResult extends MultipleQueryResult
  ? ApiMultipleResultQueryManager<TEntity>
  : TQueryResult extends SingleQueryResult
  ? ApiSingleResultQueryManager<TEntity>
  : never;

export interface ApiModelManager<TEntity extends Entity, TConfig extends ApiModelConfig>
  extends IBaseModelManager<TEntity> {
  /**
   * Gets the AntJS model config.
   * @returns AntJS model config.
   */
  config(): TConfig;
  /**
   * Sets the AntJS model onfig.
   * @param config AntJS model config.
   */
  config(config: TConfig): this;
  /**
   * Gets a query from its alias.
   * @param alias Alias of the query.
   * @returns Query found.
   */
  query<TResult extends TEntity | TEntity[]>(alias: string): ApiQueryManager<TEntity, TResult>;
  /**
   * Adds a query to the manager.
   * @param query Query to add.
   * @param aliasOrNothing Alias of the query.
   * @returns This instance.
   */
  query<TQueryResult extends QueryResult>(
    queryConfig: ApiQueryConfig<TEntity, TQueryResult>,
    aliasOrNothing?: string,
  ): TAntQueryManager<TEntity, TQueryResult>;
}
