import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModelManager } from './IModelManager';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
import {
  MULTIPLE_RESULT_QUERY_CODE,
  SINGLE_RESULT_QUERY_CODE,
  VOID_RESULT_STRING,
} from './LuaConstants';
import { CacheOptions } from './options/CacheOptions';
import { ICacheOptions } from './options/ICacheOptions';
import { IPrimaryQueryManager } from './query/IPrimaryQueryManager';

export class ModelManager<TEntity extends IEntity> implements IModelManager<TEntity> {
  /**
   * Primary entity manager.
   */
  protected _primaryEntityManager: IPrimaryEntityManager<TEntity>;
  /**
   * Query managers.
   */
  protected _queryManagers: Array<IPrimaryQueryManager<TEntity>>;
  /**
   * Redis connection to manage queries.
   */
  protected _redis: IORedis.Redis;

  /**
   * Creates a new model manager.
   * @param primaryEntityManager Primary entity manager.
   * @param queryManagers Query managers.
   */
  public constructor(
    redis: IORedis.Redis,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    queryManagers: Array<IPrimaryQueryManager<TEntity>> = new Array(),
  ) {
    this._primaryEntityManager = primaryEntityManager;
    this._queryManagers = queryManagers;
    this._redis = redis;
  }

  /**
   * Adds a query manager to the model manager.
   * @param queryManager Query manager to add.
   */
  public addQuery(queryManager: IPrimaryQueryManager<TEntity>): this {
    this._queryManagers.push(queryManager);
    return this;
  }

  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @returns Promise of entity deleted.
   */
  public delete(id: number|string): Promise<any> {
    const promises = new Array<Promise<any>>();
    for (const queryManager of this._queryManagers) {
      promises.push(queryManager.syncDelete(id));
    }
    promises.push(this._primaryEntityManager.delete(id));
    return Promise.all(promises);
  }

  /**
   * Finds an entity by its id.
   * @param id Id of the entity.
   * @param cacheOptions Cache options.
   * @returns Entity found
   */
  public get(id: number|string, cacheOptions?: ICacheOptions): Promise<TEntity> {
    return this._primaryEntityManager.getById(id, cacheOptions);
  }

  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @returns Promise of entities deleted.
   */
  public mDelete(ids: number[]|string[]): Promise<any> {
    const promises = new Array<Promise<any>>();
    for (const queryManager of this._queryManagers) {
      promises.push(queryManager.syncMDelete(ids));
    }
    promises.push(this._primaryEntityManager.mDelete(ids));
    return Promise.all(promises);
  }

  /**
   * Finds a collection if entities by its ids.
   * @param ids Ids of the entities.
   * @param cacheOptions Cache options.
   * @returns Entities found.
   */
  public mGet(ids: number[]|string[], cacheOptions?: ICacheOptions): Promise<TEntity[]> {
    return this._primaryEntityManager.getByIds(ids, cacheOptions);
  }

  /**
   * Updates multiple entities at the cache layer.
   * @param entities Entities to be updated.
   * @param cacheOptions Cache options.
   * @returns Priomise of entities updated.
   */
  public mUpdate(
    entities: TEntity[],
    cacheOptions: ICacheOptions = new CacheOptions(),
  ): Promise<any> {
    const promises = new Array<Promise<any>>();
    for (const queryManager of this._queryManagers) {
      promises.push(queryManager.syncMUpdate(entities));
    }
    promises.push(this._primaryEntityManager.mUpdate(entities, cacheOptions));
    return Promise.all(promises);
  }

  /**
   * Updates an entity at the cache layer.
   * @param entity Entitty to update.
   * @param cacheOptions Cache options.
   * @returns Promise of entity updated.
   */
  public update(
    entity: TEntity,
    cacheOptions: ICacheOptions = new CacheOptions(),
  ): Promise<any> {
    const promises = new Array<Promise<any>>();
    for (const queryManager of this._queryManagers) {
      promises.push(queryManager.syncUpdate(entity));
    }
    promises.push(this._primaryEntityManager.update(entity, cacheOptions));
    return Promise.all(promises);
  }
}
