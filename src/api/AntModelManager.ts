import { IEntity } from '../model/IEntity';
import { IModel } from '../model/IModel';
import { IModelManager } from '../persistence/primary/IModelManager';
import { ICacheOptions } from '../persistence/primary/options/ICacheOptions';
import {
  IPrimaryQueryManager,
} from '../persistence/primary/query/IPrimaryQueryManager';
import { MultipleResultQueryManager } from '../persistence/primary/query/MultipleResultQueryManager';
import {
  QueryResult,
  TMQuery,
  TQuery,
} from '../persistence/primary/query/PrimaryQueryManager';
import { SingleResultQueryManager } from '../persistence/primary/query/SingleResultQueryManager';
import { IAntModelConfig } from './config/IAntModelConfig';
import { IAntQueryConfig } from './config/IAntQueryConfig';
import {
  IAntModelManager,
  TAntQueryManager,
} from './IAntModelManager';
import { AntMultipleResultQueryManager } from './query/AntMultipleResultQueryManager';
import { AntSingleResultQueryManager } from './query/AntSingleResultQueryManager';
import { IAntMultipleResultQueryManager } from './query/IAntMultipleResultQueryManager';
import { IAntQueryManager } from './query/IAntQueryManager';
import { IAntSingleResultQueryManager } from './query/IAntSingleResultQueryManager';

export type QueryMapType<
  TEntity extends IEntity,
  TModel extends IModel
> = Map<string, [TModel, IAntQueryManager<TEntity, TEntity|TEntity[]>]>;

export abstract class AntModelManager<
  TEntity extends IEntity,
  TConfig extends IAntModelConfig,
  TModel extends IModel,
  TModelManager extends IModelManager<TEntity>,
>
  implements IAntModelManager<TEntity, TConfig> {

  /**
   * AntJS model config.
   */
  protected _config: TConfig;
  /**
   * Model to manage
   */
  protected _model: TModel;
  /**
   * AntJS model manager
   */
  protected _modelManager: TModelManager;
  /**
   * Queries map.
   */
  protected _queriesMap: QueryMapType<TEntity, TModel>;
  /**
   * Creates a new queries map.
   * @param model Model to manage.
   * @param queriesMap Queries map.
   */
  public constructor(
    model: TModel,
    queriesMap: QueryMapType<TEntity, TModel>,
  ) {
    this._model = model;
    this._queriesMap = queriesMap;
  }
  /**
   * Model manager
   */
  protected get modelManager(): TModelManager {
    if (!this._modelManager) {
      throw new Error(
`The current action could not be performed because the model manager is not ready.
This is probably caused by the absence of a config instance. Ensure that config is set.`,
      );
    }
    return this._modelManager;
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
  public config(config?: TConfig): TConfig|this {
    if (undefined === config) {
      return this._config;
    } else {
      if (this._config) {
        throw new Error('The model manager already has a configuration. It\'s not possible to change it.');
      }
      this._config = config;
      this._modelManager = this._generateModelManager(this._model, this._config);
      return this;
    }
  }
  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @returns Promise of entity deleted.
   */
  public delete(id: number|string): Promise<any> {
    return this.modelManager.delete(id);
  }
  /**
   * Finds an entity by its id.
   * @param id Id of the entity.
   * @param cacheOptions Cache options.
   * @returns Entity found
   */
  public get(id: string | number, cacheOptions?: ICacheOptions): Promise<TEntity> {
    return this.modelManager.get(id, cacheOptions);
  }
  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @returns Promise of entities deleted.
   */
  public mDelete(ids: number[]|string[]): Promise<any> {
    return this.modelManager.mDelete(ids);
  }
  /**
   * Finds a collection if entities by its ids.
   * @param ids Ids of the entities.
   * @param cacheOptions Cache options.
   * @returns Entities found.
   */
  public mGet(ids: number[] | string[], cacheOptions?: ICacheOptions): Promise<TEntity[]> {
    return this.modelManager.mGet(ids, cacheOptions);
  }

  /**
   * Gets a query from its alias.
   * @param alias Alias of the query.
   * @returns Query found.
   */
  public query<TResult extends TEntity | TEntity[]>(
    alias: string,
  ): IAntQueryManager<TEntity, TResult>;
  /**
   * Adds a query to the manager.
   * @param queryConfig query manager config to add.
   * @param aliasOrNothing Alias of the query.
   * @returns Query manager generated from the config.
   */
  public query<TQueryResult extends QueryResult>(
    queryConfig: IAntQueryConfig<TEntity, TQueryResult>,
    aliasOrNothing?: string,
  ): TAntQueryManager<TEntity, TQueryResult>;
  /**
   * Adds or obtains a query.
   * @param queryOrAlias Query to manage or alias of the query to obtain.
   * @param aliasOrNothing Alias of the query to manage.
   * @returns Query found r this instance.
   */
  public query<TResult extends QueryResult & (TEntity | TEntity[])>(
    queryOrAlias: IAntQueryConfig<TEntity, TResult>|string,
    aliasOrNothing?: string,
  ): IAntQueryManager<TEntity, TResult> | TAntQueryManager<TEntity, TResult> {
    if ('string' === typeof queryOrAlias) {
      return this._queryGetQuery<TResult>(queryOrAlias);
    } else {
      return this._querySetQuery(queryOrAlias, aliasOrNothing);
    }
  }
  /**
   * Updates multiple entities at the cache layer.
   * @param entities Entities to be updated.
   * @returns Priomise of entities updated.
   */
  public mUpdate(entities: TEntity[]): Promise<any> {
    return this.modelManager.mUpdate(entities);
  }
  /**
   * Updates an entity at the cache layer.
   * @param entity Entitty to update.
   * @returns Promise of entity updated.
   */
  public update(entity: TEntity): Promise<any> {
    return this.modelManager.update(entity);
  }
  /**
   * Generates a new model manager.
   * @param model Model of the manager.
   * @param config Manager config.
   */
  protected abstract _generateModelManager(
    model: TModel,
    config: TConfig,
  ): TModelManager;
  /**
   * Gets a query by its alias.
   * @param alias Alias of the query.
   * @returns Query found.
   */
  private _queryGetQuery<
    TResult extends TEntity|TEntity[] = TEntity|TEntity[]
  >(alias: string): IAntQueryManager<TEntity, TResult> {
    const mapEntry = this._queriesMap.get(alias);
    if (undefined === mapEntry) {
      return undefined;
    } else {
      const [model, query] = mapEntry;
      if (this._model === model) {
        return query as IAntQueryManager<TEntity, TResult>;
      } else {
        throw new Error('The query found manages a different model than the model managed by this manager.');
      }
    }
  }
  /**
   * Adds a query to the manager.
   * @param query Query to set.
   * @param aliasOrNothing Alias of the query.
   * @returns This instance
   */
  private _querySetQuery<TResult extends QueryResult>(
    queryConfig: IAntQueryConfig<TEntity, TResult>,
    aliasOrNothing?: string,
  ): TAntQueryManager<TEntity, TResult> {
    let query: TAntQueryManager<TEntity, TResult>;
    let innerQueryManager: IPrimaryQueryManager<TEntity>;
    if (queryConfig.isMultiple) {
      innerQueryManager = new MultipleResultQueryManager<TEntity>(
        queryConfig.query as TQuery<number[] | string[]>,
        this.modelManager,
        this._config.redis,
        queryConfig.reverseHashKey,
        queryConfig.queryKeyGen,
        queryConfig.entityKeyGen,
        queryConfig.mQuery as TMQuery<number[] | string[]>,
      );
      query = new AntMultipleResultQueryManager<TEntity>(
        innerQueryManager as MultipleResultQueryManager<TEntity>,
      ) as IAntMultipleResultQueryManager<TEntity> as TAntQueryManager<TEntity, TResult>;
    } else {
      innerQueryManager = new SingleResultQueryManager<TEntity>(
        queryConfig.query as TQuery<number | string>,
        this.modelManager,
        this._config.redis,
        queryConfig.reverseHashKey,
        queryConfig.queryKeyGen,
        queryConfig.entityKeyGen,
        queryConfig.mQuery as TMQuery<number | string>,
      );
      query = new AntSingleResultQueryManager<TEntity>(
        innerQueryManager as SingleResultQueryManager<TEntity>,
      ) as IAntSingleResultQueryManager<TEntity> as TAntQueryManager<TEntity, TResult>;
    }
    if (null != aliasOrNothing) {
      if (undefined === this._queriesMap.get(aliasOrNothing)) {
        this._queriesMap.set(aliasOrNothing, [this._model, query]);
      } else {
        throw new Error('There is already a query with this alias');
      }
    }
    this.modelManager.addQuery(innerQueryManager);
    return query;
  }
}
