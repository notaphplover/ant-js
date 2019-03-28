import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { IPrimaryQueryManager } from '../../persistence/primary/IPrimaryQueryManager';
import { ModelManager } from '../../persistence/primary/ModelManager';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import { RedisWrapper } from './RedisWrapper';
import { SingleResultQueryByFieldManager } from './SingleResultQueryByFieldManager';

export class ModelManagerGenerator<TEntity extends IEntity> {
  /**
   * Redis Wrapper
   */
  protected _redis: RedisWrapper;

  /**
   * Creates a new model manager generator.
   */
  public constructor() {
    this._redis = new RedisWrapper();
  }

  public generateModelManager(
    model: IModel,
    queryPrefix: string,
    reverseHashKey: string,
    secondaryManager: SecondaryModelManagerMock<TEntity>,
  ): IModelManager<TEntity> {
    const primaryEntityManager = new PrimaryEntityManager(model, this._redis.redis, secondaryManager);
    const queryManagers = new Array<IPrimaryQueryManager<TEntity, Promise<TEntity | TEntity[]>>>();
    // generate query managers:
    for (const property of model.properties) {
      if (property === model.id) { continue; }

      const singleResultQueryManager = new SingleResultQueryByFieldManager<TEntity>(
        (params: any) =>
          new Promise((resolve) => { resolve(
            secondaryManager.store.find(
              (value: TEntity) => value[property] === params[property],
            )[model.id],
          ); }),
        primaryEntityManager,
        this._redis.redis,
        reverseHashKey + property + '/',
        property,
        queryPrefix + property + '/',
      );
      queryManagers.push(singleResultQueryManager);
    }
    return new ModelManager(primaryEntityManager, queryManagers);
  }
}
