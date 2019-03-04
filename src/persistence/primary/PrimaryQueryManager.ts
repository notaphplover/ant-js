import IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IEntitySearchOptions } from './IEntitySearchOptions';
import { IPrimaryModelManager } from './IPrimaryModelManager';
import { IPrimaryQueryManager } from './IPrimaryQueryManager';

export abstract class PrimaryQueryManager<
  TModel extends IModel,
  TEntity extends IEntity,
  TQuery extends (params: any) => Promise<number | string | Array<number | string>>,
  TQueryResult extends Promise<TEntity | TEntity[]>
> implements IPrimaryQueryManager<TEntity, TQueryResult> {
  /**
   * Primary model manager.
   */
  protected _primaryModelManager: IPrimaryModelManager<TModel, TEntity>;
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
   * @param primaryModelManager Primary model manager.
   * @param redis Redis connection to manage queries.
   * @param reverseHashKey Key of the reverse structure to obtain a map of entities to queries.
   */
  public constructor(
    query: TQuery,
    primaryModelManager: IPrimaryModelManager<TModel, TEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
  ) {
    this._primaryModelManager = primaryModelManager;
    this._query = query;
    this._redis = redis;
    this._reverseHashKey = reverseHashKey;
    this._luaKeyGeneratorFromId = this._primaryModelManager.getKeyGenerationLuaScriptGenerator();
  }

  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   */
  public abstract deleteEntityInQueries(entity: TEntity): Promise<void>;

  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  public abstract get(
    params: any,
    searchOptions?: IEntitySearchOptions,
  ): TQueryResult;

  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   */
  public abstract updateEntityInQueries(entity: TEntity): Promise<void>;

  /**
   * Gets a key for a certain query.
   * @param param query params.
   * @returns Key generated for the query.
   */
  protected abstract _key(param: any): string;
}
