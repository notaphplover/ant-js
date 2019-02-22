import Redis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ISecondaryModelManager } from '../secondary/ISecondaryModelManager';
import { CacheOptions } from './CacheOptions';
import { EntitySearchOptions } from './EntitySearchOptions';
import { IEntitySearchOptions } from './IEntitySearchOptions';
import { IPrimaryModelManager } from './IPrimaryModelManager';

export abstract class PrimaryModelManager<TModel extends IModel, TEntity extends IEntity>
  implements IPrimaryModelManager<TModel, TEntity> {
  /**
   * Redis connection.
   */
  protected _redis: Redis.Redis;
  /**
   * Secondary model manager of the model.
   */
  protected _successor: ISecondaryModelManager<TModel, TEntity>;

  /**
   * Creates a new primary model manager.
   * @param redis Redis connection
   */
  public constructor(
    redis: Redis.Redis,
    successor: ISecondaryModelManager<TModel, TEntity>,
  ) {
    this._redis = redis;
    this._successor = successor;
  }

  /**
   * Model managed.
   */
  public get model(): TModel {
    return this._successor.model;
  }

  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param searchOptions Search options.
   * @returns Promise of entities cached.
   */
  public cacheEntities(
    entities: TEntity[],
    searchOptions: IEntitySearchOptions,
  ): Promise<any> {
    if (CacheOptions.NoCache === searchOptions.cacheOptions) {
      return new Promise<void>((resolve) => resolve());
    }
    if (CacheOptions.CacheIfNotExist === searchOptions.cacheOptions) {
      throw new Error('This version does not support to cache multiple entities only if they are not cached :(.');
    }
    if (null != searchOptions.ttl) {
      throw new Error('This version does not support to cache multiple entities with the same ttl :(.');
    }

    const cacheMap = new Map<string, string>();
    const idField = this.model.id;

    for (const entity of entities) {
      cacheMap.set(
        this._getKey(entity[idField]),
        JSON.stringify(entity),
      );
    }

    if (0 === cacheMap.size) {
      return new Promise<void>((resolve) => resolve());
    } else {
      return new Promise(
        (resolve) => resolve(
          (this._redis.mset as unknown as (map: Map<string, string>) => any)(cacheMap),
        ));
    }
  }

  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param searchOptions Search options.
   * @returns Promise of redis operation ended
   */
  public cacheEntity(entity: TEntity, searchOptions: IEntitySearchOptions): Promise<any> {
    if (CacheOptions.NoCache === searchOptions.cacheOptions) {
      return new Promise((resolve) => resolve());
    }
    const key = this._getKey(entity[this.model.id]);
    switch (searchOptions.cacheOptions) {
      case CacheOptions.CacheIfNotExist:
        return this._redis.setnx(key, JSON.stringify(entity));
      case CacheOptions.CacheAndOverwrite:
        return this._redis.set(key, JSON.stringify(entity));
      default:
        throw new Error('Unexpected cache options.');
    }
  }

  /**
   * Deletes an entity from the cache.
   * This operation is not propagated to a successor
   * @param entity Entity to delete
   * @returns Promise of entities deleted.
   */
  public deleteEntityFromCache(entity: TEntity): Promise<number> {
    return this._redis.del(this._getKey(entity[this.model.id]));
  }

  /**
   * Gets an entity by its id.
   * @param id: Entity's id.
   * @returns Model found.
   */
  public getById(
    id: number|string,
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
  ): Promise<TEntity> {
    return this._innerGetById(id, searchOptions);
  }

  /**
   * Gets a collection of entities by its ids.
   * @param ids Entities ids.
   * @returns Entities found.
   */
  public getByIds(
    ids: Array<number|string>,
    searchOptions: IEntitySearchOptions,
  ): Promise<TEntity[]> {
    return this._innerGetByIds(ids, false, searchOptions);
  }

  /**
   * Gets the key of an entity.
   * @param id entity's id.
   */
  protected abstract _getKey(id: number|string): string;

  /**
   * Gets an entity by its id.
   * @param id Entity's id.
   * @param searchOptions Search options.
   */
  protected async _innerGetById(
    id: number|string,
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
  ): Promise<TEntity> {
    const cachedEntity = await this._redis.get(this._getKey(id));
    if (cachedEntity) {
      return JSON.parse(cachedEntity);
    }
    if (!this._successor) {
      return undefined;
    }
    return this._successor.getById(id).then((entity) => {
      this.cacheEntity(entity, searchOptions);
      return entity;
    });
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param idsAreDifferent True if the ids are different.
   * @param searchOptions Search options.
   * @returns Entities found.
   */
  protected async _innerGetByIds(
    ids: Array<number|string>,
    idsAreDifferent: boolean = false,
    searchOptions: IEntitySearchOptions,
  ): Promise<TEntity[]> {
    if (0 === ids.length) {
      return new Promise((resolve) => { resolve(new Array()); });
    }
    if (!idsAreDifferent) {
      ids = Array.from(new Set(ids));
    }
    return this._innerGetByDistinctIdsNotMapped(ids, searchOptions);
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param searchOptions Search options.
   * @returns Entities found.
   */
  protected async _innerGetByDistinctIdsNotMapped(
    ids: Array<number|string>,
    searchOptions: IEntitySearchOptions,
  ): Promise<TEntity[]> {
    const keysArray = ids.map((id) => this._getKey(id));
    const entities: string[] = await this._redis.mget(...keysArray);
    const cacheResults: TEntity[] = entities.map((entity) => JSON.parse(entity));
    const results = new Array<TEntity>();
    const missingIds = new Array<number|string>();

    for (let i = 0; i < keysArray.length; ++i) {
      if (null == cacheResults[i]) {
        missingIds.push(ids[i]);
      } else {
        results.push(cacheResults[i]);
      }
    }

    if (this._successor && missingIds.length > 0) {
      const missingData = await this._successor.getByIds(missingIds);
      this.cacheEntities(missingData, searchOptions);
      for (const missingEntity of missingData) {
        results.push(missingEntity);
      }
    }

    return results;
  }
}
