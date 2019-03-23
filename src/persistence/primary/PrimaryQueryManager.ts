import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ICacheOptions } from './ICacheOptions';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
import { IPrimaryQueryManager } from './IPrimaryQueryManager';

export abstract class PrimaryQueryManager<
  TEntity extends IEntity,
  TQuery extends (params: any) => Promise<number | string | Array<number | string>>,
  TQueryResult extends Promise<TEntity | TEntity[]>
> implements IPrimaryQueryManager<TEntity, TQueryResult> {
  /**
   * Primary entity manager.
   */
  protected _primaryEntityManager: IPrimaryEntityManager<TEntity>;
  /**
   * Query to obtain ids.
   */
  protected _query: TQuery;
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
    query: TQuery,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
  ) {
    this._primaryEntityManager = primaryEntityManager;
    this._query = query;
    this._redis = redis;
    this._reverseHashKey = reverseHashKey;
    this._luaKeyGeneratorFromId = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator();
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
    searchOptions?: ICacheOptions,
  ): TQueryResult;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param searchOptions Search options.
   * @returns Queries results.
   */
  public abstract mGet(
    paramsArray: any[],
    searchOptions?: ICacheOptions,
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
}
