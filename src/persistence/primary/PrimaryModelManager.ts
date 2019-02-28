import IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IEntityKeyGenerationData } from '../../model/IEntityKeyGenerationData';
import { IModel } from '../../model/IModel';
import { ISecondaryModelManager } from '../secondary/ISecondaryModelManager';
import { CacheOptions } from './CacheOptions';
import { EntitySearchOptions } from './EntitySearchOptions';
import { IEntitySearchOptions } from './IEntitySearchOptions';
import { IPrimaryModelManager } from './IPrimaryModelManager';

export abstract class PrimaryModelManager<TModel extends IModel, TEntity extends IEntity>
  implements IPrimaryModelManager<TModel, TEntity> {

  /**
   * Model managed.
   */
  protected _model: TModel;
  /**
   * Redis connection.
   */
  protected _redis: IORedis.Redis;
  /**
   * Secondary model manager of the model.
   */
  protected _successor: ISecondaryModelManager<TModel, TEntity>;

  /**
   * Creates a new primary model manager.
   * @param redis Redis connection
   */
  public constructor(
    model: TModel,
    redis: IORedis.Redis,
    successor: ISecondaryModelManager<TModel, TEntity>,
  ) {
    this._model = model;
    this._redis = redis;
    this._successor = successor;
  }

  /**
   * Model managed.
   */
  public get model(): TModel {
    return this._model;
  }

  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param searchOptions Search options.
   * @returns Promise of entities cached.
   */
  public cacheEntities(
    entities: TEntity[],
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
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

    if (CacheOptions.CacheAndOverwrite !== searchOptions.cacheOptions) {
      throw new Error('Unexpected cache options.');
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
  public cacheEntity(
    entity: TEntity,
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
  ): Promise<any> {
    if (null == entity) {
      return new Promise((resolve) => resolve());
    }
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
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
  ): Promise<TEntity[]> {
    return this._innerGetByIds(ids, false, searchOptions);
  }

  /**
   * Gets the key generation lua script generator.
   * @returns function able to generate a lua expression that generates a key from a giving id.
   */
  public getKeyGenerationLuaScriptGenerator() {
    return this._innerGetKeyGenerationLuaScriptGenerator(this._model.entityKeyGenerationData);
  }

  /**
   * Gets the key of an entity.
   * @param id entity's id.
   */
  protected _getKey(id: number|string): string {
    return (this._model.entityKeyGenerationData.prefix || '')
      + id
      + (this._model.entityKeyGenerationData.suffix || '');
  }

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

  /**
   * Creates a function that creates a lua script to create an entity key from an id.
   * @param luaKeyGeneration Lua key gemeration params.
   */
  protected _innerGetKeyGenerationLuaScriptGenerator(luaKeyGeneration: IEntityKeyGenerationData) {
    const instructions = new Array<(alias: string) => string>();
    if (null != luaKeyGeneration.prefix && '' !== luaKeyGeneration.prefix) {
      instructions.push(() => '"' + luaKeyGeneration.prefix + '" .. ');
    }
    instructions.push((alias) => alias);
    if (null != luaKeyGeneration.suffix && '' !== luaKeyGeneration.suffix) {
      instructions.push(() => ' .. "' + luaKeyGeneration.suffix + '"');
    }
    return (alias: string) => {
      return instructions.reduce(
        (previousValue, currentValue) =>
          previousValue + currentValue(alias),
        '',
      );
    };
  }
}
