import { AntSingleResultPrimaryQueryManager } from '../../../persistence/primary/query/ant-single-result-primary-query-manager';
import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { PrimaryEntityManager } from '../../../persistence/primary/primary-entity-manager';
import { RedisMiddleware } from '../../../persistence/primary/redis-middleware';

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
   * @inheritdoc
   */
  public constructor(
    model: Model<TEntity>,
    manager: PrimaryEntityManager<TEntity>,
    query: (params: any) => Promise<number | string>,
    redis: RedisMiddleware,
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
    super(model, manager, query, redis, reverseHashKey, key, key, mQuery);
    this._field = field;
    this._queryPrefix = queryPrefix;
  }
}
