import * as IORedis from 'ioredis';
import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { IPrimaryEntityManager } from '../IPrimaryEntityManager';
import { ICacheOptions } from '../options/ICacheOptions';
import {
  IBasePrimaryQueryManager,
  IPrimaryQueryManager,
} from './IPrimaryQueryManager';

export type QueryResult = number | string | number[] | string[];
type TResult<TEntity, TQueryResult> = TQueryResult extends any[] ?
  TEntity[] :
  TEntity;
export type TMQuery<TQueryResult> = (paramsArray: any[]) => Promise<TQueryResult[]>;
export type TQuery<TQueryResult> = (params: any) => Promise<TQueryResult>;

export abstract class PrimaryQueryManager<
  TEntity extends IEntity,
  TQueryResult extends QueryResult,
> implements
    IBasePrimaryQueryManager<TEntity, TResult<TEntity, TQueryResult>>,
    IPrimaryQueryManager<TEntity> {
  /**
   * Query key generator.
   */
  protected _keyGen: (params: any) => string;
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
   * @param keyGen Key generator.
   * @param mQuery Multiple query.
   */
  public constructor(
    query: TQuery<TQueryResult>,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
    keyGen: (params: any) => string,
    mQuery: TMQuery<TQueryResult> = null,
  ) {
    this._primaryEntityManager = primaryEntityManager;
    this._query = query;
    this._redis = redis;
    this._reverseHashKey = reverseHashKey;
    this._keyGen = keyGen;
    this._luaKeyGeneratorFromId = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator();

    this._setMQuery(query, mQuery);
  }

  /**
   * True if the queries managed can return multiple results.
   */
  public abstract get isMultiple(): boolean;

  /**
   * Query's model.
   */
  public get model(): IModel {
    return this._primaryEntityManager.model;
  }

  /**
   * Obtains the reverse hash key.
   */
  public get reverseHashKey(): string {
    return this._reverseHashKey;
  }

  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  public abstract get(
    params: any,
    cacheOptions?: ICacheOptions,
  ): Promise<TResult<TEntity, TQueryResult>>;

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
   * @param id Id of the entity whose deletion must be sync.
   * @returns Promise of query sync.
   */
  public abstract syncDelete(id: number|string): Promise<void>;

  /**
   * Syncs the remove of entities in cache.
   * @param entities deleted entities.
   * @returns Promise of query sync
   */
  public abstract syncMDelete(ids: number[]|string[]): Promise<void>;

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
