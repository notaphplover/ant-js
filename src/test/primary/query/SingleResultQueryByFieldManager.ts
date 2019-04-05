import * as IORedis from 'ioredis';
import { IEntity } from '../../../model/IEntity';
import { IPrimaryEntityManager } from '../../../persistence/primary/IPrimaryEntityManager';
import { SingleResultQueryManager } from '../../../persistence/primary/query/SingleResultQueryManager';

export class SingleResultQueryByFieldManager<TEntity extends IEntity>
  extends SingleResultQueryManager<TEntity> {
  protected _field: string;
  protected _queryPrefix: string;

  /**
   * Creates a query by field manager.
   * @param query Query.
   * @param primaryEntityManager Primary entity manager.
   * @param redis Redis connection.
   * @param reverseHashKey Reverse hash key.
   * @param field Query field.
   * @param queryPrefix Query prefix.
   */
  public constructor(
    query: (params: any) => Promise<number|string>,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
    field: string,
    queryPrefix: string,
    mQuery: (paramsArray: any) => Promise<number[]|string[]> = null,
  ) {
    /**
     * Gets a key for a certain query.
     * @param param query params.
     * @returns Key generated for the query.
     */
    const key = (param: any): string => {
      return this._queryPrefix + param[this._field];
    };
    super(query, primaryEntityManager, redis, reverseHashKey, key, mQuery);
    this._field = field;
    this._queryPrefix = queryPrefix;
  }
}
