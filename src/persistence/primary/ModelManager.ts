import { IEntity } from '../../model/IEntity';
import { CacheOptions } from './CacheOptions';
import { ICacheOptions } from './ICacheOptions';
import { IModelManager } from './IModelManager';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
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
   * Creates a new model manager.
   * @param primaryEntityManager Primary entity manager.
   * @param queryManagers Query managers.
   */
  public constructor(
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    queryManagers: Array<IPrimaryQueryManager<TEntity>>,
  ) {
    this._primaryEntityManager = primaryEntityManager;
    this._queryManagers = queryManagers;
  }

  /**
   * Deletes an entity from the cache layer.
   * @param entity Entity to delete.
   * @returns Promise of entity deleted.
   */
  public delete(entity: TEntity): Promise<any> {
    const promises = new Array<Promise<any>>();
    for (const queryManager of this._queryManagers) {
      promises.push(queryManager.syncDelete(entity));
    }
    promises.push(this._primaryEntityManager.delete(entity));
    return Promise.all(promises);
  }

  /**
   * Finds an entity by its id.
   * @param id Id of the entity.
   * @param searchOptions Search options.
   * @returns Entity found
   */
  public get(id: number|string, searchOptions?: ICacheOptions): Promise<TEntity> {
    return this._primaryEntityManager.getById(id, searchOptions);
  }

  /**
   * Deletes multiple entities from the cache layer.
   * @param entities Entities to delete.
   * @returns Promise of entities deleted.
   */
  public mDelete(entities: TEntity[]): Promise<any> {
    const promises = new Array<Promise<any>>();
    for (const queryManager of this._queryManagers) {
      promises.push(queryManager.syncMDelete(entities));
    }
    promises.push(this._primaryEntityManager.mDelete(entities));
    return Promise.all(promises);
  }

  /**
   * Finds a collection if entities by its ids.
   * @param ids Ids of the entities.
   * @param searchOptions Search options.
   * @returns Entities found.
   */
  public mGet(ids: number[]|string[], searchOptions?: ICacheOptions): Promise<TEntity[]> {
    return this._primaryEntityManager.getByIds(ids, searchOptions);
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
