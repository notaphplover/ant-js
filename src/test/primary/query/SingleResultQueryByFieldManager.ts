import { Entity } from '../../../model/entity';
import { IRedisMiddleware } from '../../../persistence/primary/IRedisMiddleware';
import { PrimaryEntityManager } from '../../../persistence/primary/primary-entity-manager';
import { AntSingleResultPrimaryQueryManager } from '../../../persistence/primary/query/ant-single-result-primary-query-manager';

export class SingleResultQueryByFieldManager<TEntity extends Entity> extends AntSingleResultPrimaryQueryManager<
  TEntity
> {
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
    query: (params: any) => Promise<number | string>,
    primaryEntityManager: PrimaryEntityManager<TEntity>,
    redis: IRedisMiddleware,
    reverseHashKey: string,
    field: string,
    queryPrefix: string,
    mQuery: (paramsArray: any) => Promise<number[] | string[]> = null,
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
