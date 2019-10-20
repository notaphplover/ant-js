import { IEntity } from '../model/IEntity';
import { IBaseModelManager } from '../persistence/primary/IModelManager';
import { MultipleQueryResult, QueryResult, SingleQueryResult } from '../persistence/primary/query/PrimaryQueryManager';
import { ApiModelConfig } from './config/api-model-config';
import { ApiQueryConfig } from './config/api-query-config';
import { ApiQueryManager } from './query/api-query-manager';
import { IAntMultipleResultQueryManager } from './query/IAntMultipleResultQueryManager';
import { IAntSingleResultQueryManager } from './query/IAntSingleResultQueryManager';

export type TAntQueryManager<TEntity, TQueryResult> = TQueryResult extends MultipleQueryResult
  ? IAntMultipleResultQueryManager<TEntity>
  : TQueryResult extends SingleQueryResult
  ? IAntSingleResultQueryManager<TEntity>
  : never;

export interface ApiModelManager<TEntity extends IEntity, TConfig extends ApiModelConfig>
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
