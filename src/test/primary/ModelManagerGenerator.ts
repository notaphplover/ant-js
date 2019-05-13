import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { ModelManager } from '../../persistence/primary/ModelManager';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { IPrimaryQueryManager } from '../../persistence/primary/query/IPrimaryQueryManager';
import { SecondaryEntityManagerMock } from '../secondary/SecondaryEntityManagerMock';
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

  /**
   * Generates a model manager with a query for each property defined in the model to manage.
   * @param model Model to manage.
   * @param modelPrefix Model prefix.
   * @param queryPrefix Query prefix.
   * @param reverseHashKey Reverse map hash key.
   * @param secondaryManager Secondary model manager.
   * @param useEntityNegativeCache True to use negative entity cache.
   * @returns Model manager, primary entity manager and a map of properties to query managers.
   */
  public generateModelManager(
    model: IModel,
    properties: string[],
    queryPrefix: string,
    reverseHashKey: string,
    secondaryManager: SecondaryEntityManagerMock<TEntity>,
    useEntityNegativeCache = true,
    redis?: IORedis.Redis,
  ): [
    IModelManager<TEntity>,
    IPrimaryEntityManager<TEntity>,
    Map<string, IPrimaryQueryManager<TEntity>>,
  ] {
    const redisConn = redis || this._redis.redis;
    const primaryEntityManager = new PrimaryEntityManager(
      model,
      redisConn,
      secondaryManager,
    );
    const queryManagers = new Array<IPrimaryQueryManager<TEntity>>();
    const queriesMap = new Map<string, IPrimaryQueryManager<TEntity>>();
    for (const property of properties) {
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
        redisConn,
        reverseHashKey + property + '/',
        property,
        queryPrefix + property + '/',
      );
      queriesMap.set(property, singleResultQueryManager);
      queryManagers.push(singleResultQueryManager);
    }
    return [
      new ModelManager(
        model,
        redisConn,
        primaryEntityManager,
        useEntityNegativeCache,
        queryManagers,
      ),
      primaryEntityManager,
      queriesMap,
    ];
  }

  /**
   * Creates a model manager with no queries
   * @param model Model to manage.
   * @param modelPrefix Model prefix.
   * @param secondaryManager Secondary model manager.
   */
  public generateZeroQueriesModelManager(
    model: IModel,
    secondaryManager: SecondaryEntityManagerMock<TEntity>,
    redis?: IORedis.Redis,
  ): [
    IModelManager<TEntity>,
    IPrimaryEntityManager<TEntity>,
  ] {
    const redisConn = redis || this._redis.redis;
    const primaryEntityManager = new PrimaryEntityManager(
      model,
      redisConn,
      secondaryManager,
    );

    return [
      new ModelManager(
        model,
        redisConn,
        primaryEntityManager,
      ),
      primaryEntityManager,
    ];
  }
}
