import { Entity } from '../../../model/entity';
import { IPrimaryEntityManager } from '../../../persistence/primary/IPrimaryEntityManager';
import { IRedisMiddleware } from '../../../persistence/primary/IRedisMiddleware';
import { TMQuery, TQuery } from '../../../persistence/primary/query/ant-primary-query-manager';
import { MultipleResultQueryManager } from '../../../persistence/primary/query/MultipleResultQueryManager';

export class MultipleResultQueryByFieldManager<TEntity extends Entity> extends MultipleResultQueryManager<TEntity> {
  /**
   * Field to filter.
   */
  protected _field: string;
  /**
   * Query prefix.
   */
  protected _queryPrefix: string;

  /**
   * Creates a query by field manager.
   * @param query Query.
   * @param primaryEntityManager Primary entity manager.
   * @param redis Redis connection.
   * @param reverseHashKey Reverse hash key.
   * @param field Query field.
   * @param queryPrefix Query prefix.
   * @param mQuery Multiple result query.
   */
  public constructor(
    query: TQuery<number[] | string[]>,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    redis: IRedisMiddleware,
    reverseHashKey: string,
    field: string,
    queryPrefix: string,
    mQuery: TMQuery<number[] | string[]> = null,
  ) {
    /**
     * Gets a key for a certain query.
     * @param param query params.
     * @returns Key generated for the query.
     */
    const key = (param: any): string => {
      return this._queryPrefix + param[this._field];
    };
    super(query, primaryEntityManager, redis, reverseHashKey, key, key, mQuery);
    this._field = field;
    this._queryPrefix = queryPrefix;
  }
}
