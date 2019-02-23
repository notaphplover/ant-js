import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { PrimaryModelManager } from '../../persistence/primary/PrimaryModelManager';
import { ISecondaryModelManager } from '../../persistence/secondary/ISecondaryModelManager';

export class MinimunPrimaryModelManager<TModel extends IModel, TEntity extends IEntity>
  extends PrimaryModelManager<TModel, TEntity> {

  /**
   * key prefix.
   */
  protected _keyPrefix: string;

  /**
   * Creates a primary model manager.
   * @param redis Redis instance.
   * @param successor Manager's successor to use if redis fails to obtain data.
   * @param keyPrefix Redis keys prefix for the managed entities.
   */
  public constructor(
    redis: IORedis.Redis,
    successor: ISecondaryModelManager<TModel, TEntity>,
    keyPrefix: string,
  ) {
    super(redis, successor);
    this._keyPrefix = keyPrefix;
  }

  protected _getKey(id: number|string): string {
    return this._keyPrefix + id.toString();
  }
}
