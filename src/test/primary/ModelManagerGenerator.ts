import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { ModelManager } from '../../persistence/primary/ModelManager';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { IPrimaryQueryManager } from '../../persistence/primary/query/IPrimaryQueryManager';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import { SingleResultQueryByFieldManager } from './query/SingleResultQueryByFieldManager';
import { RedisWrapper } from './RedisWrapper';

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
  ): [
    IModelManager<TEntity>,
    IPrimaryEntityManager<TEntity>,
    Map<string, IPrimaryQueryManager<TEntity, Promise<TEntity|TEntity[]>>>
  ] {
    const primaryEntityManager = new PrimaryEntityManager(model, this._redis.redis, secondaryManager);
    const queryManagers = new Array<IPrimaryQueryManager<TEntity, Promise<TEntity | TEntity[]>>>();
    const queriesMap = new Map<string, IPrimaryQueryManager<TEntity, Promise<TEntity | TEntity[]>>>();
    for (const property of model.properties) {
      if (property === model.id) { continue; }

      const singleResultQueryManager = new SingleResultQueryByFieldManager<TEntity>(
        (params: any) =>
          new Promise((resolve) => {
            const entity = secondaryManager.store.find(
              (value: TEntity) => value[property] === params[property],
            );
            resolve(entity ? entity[model.id] : null);
          }),
        primaryEntityManager,
        this._redis.redis,
        reverseHashKey + property + '/',
        property,
        queryPrefix + property + '/',
      );
      queriesMap.set(property, singleResultQueryManager);
      queryManagers.push(singleResultQueryManager);
    }
    return [
      new ModelManager(primaryEntityManager, queryManagers),
      primaryEntityManager,
      queriesMap,
    ];
  }
}
