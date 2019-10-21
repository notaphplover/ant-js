import { Entity } from '../../../model/entity';
import { IPrimaryEntityManager } from '../IPrimaryEntityManager';
import { IRedisMiddleware } from '../IRedisMiddleware';
import { PersistencySearchOptions } from '../options/persistency-search-options';
import { IBasePrimaryQueryManager, IPrimaryQueryManager } from './IPrimaryQueryManager';

export type MultipleQueryResult = number[] | string[];
export type SingleQueryResult = number | string;

export type QueryResult = MultipleQueryResult | SingleQueryResult;
type TResult<TEntity, TQueryResult> = TQueryResult extends MultipleQueryResult
  ? TEntity[]
  : TQueryResult extends SingleQueryResult
  ? TEntity
  : never;

export type TMQuery<TQueryResult> = (paramsArray: any[]) => Promise<TQueryResult[]>;
export type TQuery<TQueryResult> = (params: any) => Promise<TQueryResult>;

export abstract class PrimaryQueryManager<TEntity extends Entity, TQueryResult extends QueryResult>
  implements IBasePrimaryQueryManager<TEntity, TResult<TEntity, TQueryResult>>, IPrimaryQueryManager<TEntity> {
  /**
   * Entity key generator.
   */
  protected _entityKeyGen: (entity: TEntity) => string;
  /**
   * Query key generator.
   */
  protected _queryKeyGen: (params: any) => string;
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
  protected _redis: IRedisMiddleware;
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
   * @param queryKeyGen Query key generator.
   * @param mQuery Multiple query.
   */
  public constructor(
    query: TQuery<TQueryResult>,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    redis: IRedisMiddleware,
    reverseHashKey: string,
    queryKeyGen: (params: any) => string,
    entityKeyGen?: (entity: TEntity) => string,
    mQuery?: TMQuery<TQueryResult>,
  ) {
    this._primaryEntityManager = primaryEntityManager;
    this._query = query;
    this._redis = redis;
    this._reverseHashKey = reverseHashKey;
    this._queryKeyGen = queryKeyGen;
    this._entityKeyGen = entityKeyGen ? entityKeyGen : queryKeyGen;
    this._luaKeyGeneratorFromId = this._primaryEntityManager.getLuaKeyGeneratorFromId();

    this._setMQuery(query, mQuery);
  }

  /**
   * True if the queries managed can return multiple results.
   */
  public abstract get isMultiple(): boolean;

  /**
   * Query key generator.
   */
  public get entityKeyGen(): (entity: TEntity) => string {
    return this._entityKeyGen;
  }

  /**
   * Query key generator.
   */
  public get queryKeyGen(): (params: any) => string {
    return this._queryKeyGen;
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
  public abstract get(params: any, options?: PersistencySearchOptions): Promise<TResult<TEntity, TQueryResult>>;

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param options Cache options.
   * @returns Queries results.
   */
  public abstract mGet(paramsArray: any[], options?: PersistencySearchOptions): Promise<TEntity[]>;

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
