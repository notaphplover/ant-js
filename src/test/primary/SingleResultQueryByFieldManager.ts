import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IPrimaryModelManager } from '../../persistence/primary/IPrimaryModelManager';
import { SingleResultQueryManager } from '../../persistence/primary/SingleResultQueryManager';

export class SingleResultQueryByFieldManager<TEntity extends IEntity>
  extends SingleResultQueryManager<TEntity> {
  protected _field: string;
  protected _queryPrefix: string;

  /**
   * Creates a query by field manager.
   * @param query Query.
   * @param primaryModelManager Primary model manager.
   * @param redis Redis connection.
   * @param reverseHashKey Reverse hash key.
   * @param field Query field.
   * @param queryPrefix Query prefix.
   */
  public constructor(
    query: (params: any) => Promise<number | string>,
    primaryModelManager: IPrimaryModelManager<TEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
    field: string,
    queryPrefix: string,
  ) {
    if (
      undefined === primaryModelManager.model.properties.find(
        (property) => field === property)
    ) {
      throw new Error('Field not in the model managed.');
    }
    super(query, primaryModelManager, redis, reverseHashKey);
    this._field = field;
    this._queryPrefix = queryPrefix;
  }

  /**
   * Gets a key for a certain query.
   * @param param query params.
   * @returns Key generated for the query.
   */
  protected _key(param: any): string {
    return this._queryPrefix + param[this._field];
  }
}
