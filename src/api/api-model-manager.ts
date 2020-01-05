import { MultipleQueryResult, QueryResult, SingleQueryResult } from '../persistence/primary/query/query-types';
import { ApiModelConfig } from './config/api-model-config';
import { ApiMultipleResultQueryManager } from './query/api-multiple-result-query-manager';
import { ApiQueryConfig } from './config/api-query-config';
import { ApiSingleResultQueryManager } from './query/api-single-result-query-manager';
import { BasePrimaryModelManager } from '../persistence/primary/primary-model-manager';
import { Entity } from '../model/entity';

export type TAntQueryManager<TEntity, TQueryResult> = TQueryResult extends MultipleQueryResult
  ? ApiMultipleResultQueryManager<TEntity>
  : TQueryResult extends SingleQueryResult
  ? ApiSingleResultQueryManager<TEntity>
  : never;

export interface ApiModelManager<TEntity extends Entity, TConfig extends ApiModelConfig>
  extends BasePrimaryModelManager<TEntity> {
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
   * Adds a query to the manager.
   * @param query Query to add.
   * @returns This instance.
   */
  query<TQueryResult extends QueryResult>(
    queryConfig: ApiQueryConfig<TEntity, TQueryResult>,
  ): TAntQueryManager<TEntity, TQueryResult>;
}
