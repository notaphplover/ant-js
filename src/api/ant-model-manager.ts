import { ApiModelManager, TAntQueryManager } from './api-model-manager';
import { QueryResult, TMQuery, TQuery } from '../persistence/primary/query/query-types';
import { AntMultipleResultPrimaryQueryManager } from '../persistence/primary/query/ant-multiple-result-primary-query-manager';
import { AntMultipleResultQueryManager } from './query/ant-multiple-result-query-manager';
import { AntSingleResultPrimaryQueryManager } from '../persistence/primary/query/ant-single-result-primary-query-manager';
import { AntSingleResultQueryManager } from './query/ant-single-result-query-manager';
import { ApiModelConfig } from './config/api-model-config';
import { ApiMultipleResultQueryManager } from './query/api-multiple-result-query-manager';
import { ApiQueryConfig } from './config/api-query-config';
import { ApiSingleResultQueryManager } from './query/api-single-result-query-manager';
import { Entity } from '../model/entity';
import { Model } from '../model/model';
import { PersistencyDeleteOptions } from '../persistence/primary/options/persistency-delete-options';
import { PersistencySearchOptions } from '../persistence/primary/options/persistency-search-options';
import { PrimaryQueryManager } from '../persistence/primary/query/primary-query-manager';
import { SchedulerModelManager } from '../persistence/scheduler/scheduler-model-manager';

export abstract class AntModelManager<
  TEntity extends Entity,
  TConfig extends ApiModelConfig,
  TModel extends Model<TEntity>,
  TScheduledManager extends SchedulerModelManager<TEntity, TModel>
> implements ApiModelManager<TEntity, TConfig> {
  /**
   * AntJS model config.
   */
  protected _config: TConfig;
  /**
   * Model to manage
   */
  protected _model: TModel;
  /**
   * Scheduled manager
   */
  protected _scheduledManager: TScheduledManager;
  /**
   * Creates a new queries map.
   * @param model Model to manage.
   * @param queriesMap Queries map.
   */
  public constructor(model: TModel) {
    this._model = model;
  }

  protected get scheduledManager(): TScheduledManager {
    if (!this._scheduledManager) {
      this._throwMissingConfigError();
    }
    return this._scheduledManager;
  }

  /**
   * Gets the current AntJS model config.
   * @returns Current AntJS model config.
   */
  public config(): TConfig;
  /**
   * Sets the current AntJS model config.
   * @param config new AntJS model config.
   * @returns this instance.
   */
  public config(config: TConfig): this;
  public config(config?: TConfig): TConfig | this {
    if (undefined === config) {
      return this._config;
    } else {
      if (this._config) {
        throw new Error("The model manager already has a configuration. It's not possible to change it.");
      }
      this._config = config;
      this._scheduledManager = this._generateScheduledManager(this._model, this._config);
      return this;
    }
  }
  /**
   * Deletes an entity.
   * @param id id of the entity to delete.
   * @param options Delete options.
   * @returns Promise of entity deleted.
   */
  public async delete(id: number | string, options?: PersistencyDeleteOptions): Promise<any> {
    return this.scheduledManager.delete(id, options);
  }
  /**
   * Finds an entity by its id.
   * @param id Id of the entity.
   * @param options Cache options.
   * @returns Entity found
   */
  public get(id: string | number, options?: PersistencySearchOptions): Promise<TEntity> {
    return this.scheduledManager.get(id, options);
  }
  /**
   * Deletes multiple entities.
   * @param ids Ids of the entities to delete.
   * @param options Delete options.
   * @returns Promise of entities deleted.
   */
  public async mDelete(ids: number[] | string[], options?: PersistencyDeleteOptions): Promise<any> {
    return this.scheduledManager.mDelete(ids, options);
  }
  /**
   * Finds a collection if entities by its ids.
   * @param ids Ids of the entities.
   * @param options Cache options.
   * @returns Entities found.
   */
  public mGet(ids: number[] | string[], options?: PersistencySearchOptions): Promise<TEntity[]> {
    return this.scheduledManager.mGet(ids, options);
  }

  /**
   * Adds a query to the manager.
   * @param query Query to add.
   * @returns This instance.
   */
  public query<TResult extends QueryResult>(
    queryConfig: ApiQueryConfig<TEntity, TResult>,
  ): TAntQueryManager<TEntity, TResult> {
    return this._querySetQuery(queryConfig);
  }

  /**
   * Generates a new scheduled manager.
   * @param model Model of the manager.
   * @param config Manager config.
   * @returns Scheduled manager generated.
   */
  protected abstract _generateScheduledManager(model: TModel, config: TConfig): TScheduledManager;

  /**
   * Adds a query to the manager.
   * @param query Query to set.
   * @returns This instance
   */
  private _querySetQuery<TResult extends QueryResult>(
    queryConfig: ApiQueryConfig<TEntity, TResult>,
  ): TAntQueryManager<TEntity, TResult> {
    let query: TAntQueryManager<TEntity, TResult>;
    let innerQueryManager: PrimaryQueryManager<TEntity>;
    if (queryConfig.isMultiple) {
      innerQueryManager = new AntMultipleResultPrimaryQueryManager<TEntity>(
        queryConfig.query as TQuery<number[] | string[]>,
        this.scheduledManager,
        this._config.redis,
        queryConfig.reverseHashKey,
        queryConfig.queryKeyGen,
        queryConfig.entityKeyGen,
        queryConfig.mQuery as TMQuery<number[] | string[]>,
      );
      query = (new AntMultipleResultQueryManager<TEntity>(
        innerQueryManager as AntMultipleResultPrimaryQueryManager<TEntity>,
      ) as ApiMultipleResultQueryManager<TEntity>) as TAntQueryManager<TEntity, TResult>;
    } else {
      innerQueryManager = new AntSingleResultPrimaryQueryManager<TEntity>(
        queryConfig.query as TQuery<number | string>,
        this.scheduledManager,
        this._config.redis,
        queryConfig.reverseHashKey,
        queryConfig.queryKeyGen,
        queryConfig.entityKeyGen,
        queryConfig.mQuery as TMQuery<number | string>,
      );
      query = (new AntSingleResultQueryManager<TEntity>(
        innerQueryManager as AntSingleResultPrimaryQueryManager<TEntity>,
      ) as ApiSingleResultQueryManager<TEntity>) as TAntQueryManager<TEntity, TResult>;
    }

    this.scheduledManager.addQuery(innerQueryManager);
    return query;
  }

  /**
   * Throws a missing config error;
   */
  private _throwMissingConfigError(): never {
    throw new Error(
      `The current action could not be performed because the model manager is not ready.
This is probably caused by the absence of a config instance. Ensure that config is set.`,
    );
  }
}
