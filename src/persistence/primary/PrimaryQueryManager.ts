import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ICacheOptions } from './ICacheOptions';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
import {
  IBasePrimaryQueryManager,
  IPrimaryQueryManager,
} from './query/IPrimaryQueryManager';

type TResult<TEntity, TQueryResult> = TQueryResult extends any[] ?
  Promise<TEntity[]> :
  Promise<TEntity>;
type TMQuery<TQueryResult> = (paramsArray: any[]) => Promise<TQueryResult[]>;
type TQuery<TQueryResult> = (params: any) => Promise<TQueryResult>;

export abstract class PrimaryQueryManager<
  TEntity extends IEntity,
  TQueryResult extends number | string | number[] | string[],
> implements
    IBasePrimaryQueryManager<TEntity, TResult<TEntity, TQueryResult>>,
    IPrimaryQueryManager<TEntity> {
  /**
   * Multiple query
   */
  protected _mquery: TMQuery<TQueryResult>;
  /**
   * Primary entity manager.
   */
  protected _primaryEntityManager: IPrimaryEntityManager<TEntity>;
  /**
   * Query to obtain ids.
   */
  protected _query: TQuery<TQueryResult>;
  /**
   * Redis connection to manage queries.
   */
  protected _redis: IORedis.Redis;
  /**
   * Key of the reverse structure to obtain a map of entities to queries.
   */
  protected _reverseHashKey: string;
  /**
   * Lua expression generator.
   */
  protected _luaKeyGeneratorFromId: (alias: string) => string;

  /**
   * Creates primary query manager.
   * @param query Query to obtain ids.
   * @param primaryEntityManager Primary entity manager.
   * @param redis Redis connection to manage queries.
   * @param reverseHashKey Key of the reverse structure to obtain a map of entities to queries.
   */
  public constructor(
    query: TQuery<TQueryResult>,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
    mQuery: TMQuery<TQueryResult> = null,
  ) {
    this._primaryEntityManager = primaryEntityManager;
    this._query = query;
    this._redis = redis;
    this._reverseHashKey = reverseHashKey;
    this._luaKeyGeneratorFromId = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator();

    this._setMQuery(query, mQuery);
  }

  /**
   * Query's model.
   */
  public get model(): IModel {
    return this._primaryEntityManager.model;
  }

  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  public abstract get(
    params: any,
    cacheOptions?: ICacheOptions,
  ): TResult<TEntity, TQueryResult>;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param cacheOptions Cache options.
   * @returns Queries results.
   */
  public abstract mGet(
    paramsArray: any[],
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity[]>;

  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   */
  public abstract syncDelete(entity: TEntity): Promise<void>;

  /**
   * Syncs the remove of entities in cache.
   * @param entities deleted entities.
   * @returns Promise of query sync
   */
  public abstract syncMDelete(entities: TEntity[]): Promise<void>;

  /**
   * Syncs the update of multiple entities.
   * @param entities updated entities.
   * @returns Promise of query sync
   */
  public abstract syncMUpdate(entities: TEntity[]): Promise<void>;

  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   */
  public abstract syncUpdate(entity: TEntity): Promise<void>;

  /**
   * Gets a key for a certain query.
   * @param param query params.
   * @returns Key generated for the query.
   */
  protected abstract _key(param: any): string;

  /**
   * Creates an standard mquery.
   * @param query query to manage.
   */
  private _getDefaultMQuery(query: TQuery<TQueryResult>): TMQuery<TQueryResult> {
    return (paramsArray: any) => {
      const promisesArray = new Array<Promise<TQueryResult>>();
      for (const params of paramsArray) {
        promisesArray.push(query(params));
      }
      return Promise.all(promisesArray);
    };
  }

  /**
   * Sets the mquery (if provided) or creates a default one.
   * @param query query to manage.
   * @param mQuery mquery to manage.
   */
  private _setMQuery(query: TQuery<TQueryResult>, mQuery: TMQuery<TQueryResult>): void {
    if (null == mQuery) {
      this._mquery = this._getDefaultMQuery(query);
    } else {
      this._mquery = mQuery;
    }
  }
}
