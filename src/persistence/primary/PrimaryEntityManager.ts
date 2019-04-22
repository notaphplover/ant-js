import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IKeyGenParams } from '../../model/IKeyGenParams';
import { IModel } from '../../model/IModel';
import { ISecondaryEntityManager } from '../secondary/ISecondaryEntityManager';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
import { CacheMode } from './options/CacheMode';
import { CacheOptions } from './options/CacheOptions';
import { ICacheOptions } from './options/ICacheOptions';

export class PrimaryEntityManager<TEntity extends IEntity>
  implements IPrimaryEntityManager<TEntity> {

  /**
   * Model managed.
   */
  protected _model: IModel;
  /**
   * Redis connection.
   */
  protected _redis: IORedis.Redis;
  /**
   * Secondary model manager of the model.
   */
  protected _successor: ISecondaryEntityManager<TEntity>;

  /**
   * Creates a new primary model manager.
   * @param keyGenParams Key generation params.
   * @param model Model of the entities managed.
   * @param redis Redis connection.
   * @param successor Secondary entity manager.
   */
  public constructor(
    model: IModel,
    redis: IORedis.Redis,
    successor: ISecondaryEntityManager<TEntity>,
  ) {
    this._model = model;
    this._redis = redis;
    this._successor = successor;
  }

  /**
   * Model managed.
   */
  public get model(): IModel {
    return this._model;
  }

  /**
   * Deletes an entity from the cache
   * @param id Id of the entity to be deleted.
   * @returns Promise of entity deleted.
   */
  public delete(id: number|string) {
    return this._redis.del(this._getKey(id));
  }

  /**
   * Gets an entity by its id.
   * @param id: Entity's id.
   * @returns Model found.
   */
  public getById(
    id: number|string,
    cacheOptions: ICacheOptions = new CacheOptions(),
  ): Promise<TEntity> {
    return this._innerGetById(id, cacheOptions);
  }

  /**
   * Gets a collection of entities by its ids.
   * @param ids Entities ids.
   * @returns Entities found.
   */
  public getByIds(
    ids: number[] | string[],
    cacheOptions: ICacheOptions = new CacheOptions(),
  ): Promise<TEntity[]> {
    return this._innerGetByIds(ids, cacheOptions);
  }

  /**
   * Gets the key generation lua script generator.
   * @returns function able to generate a lua expression that generates a key from a giving id.
   */
  public getKeyGenerationLuaScriptGenerator() {
    return this._innerGetKeyGenerationLuaScriptGenerator(this.model.keyGen);
  }

  /**
   * Deletes multiple entities.
   * @param ids Ids of the entities to delete.
   * @returns Promise of entities deleted.
   */
  public mDelete(ids: number[]|string[]): Promise<void> {
    if (null == ids || 0 === ids.length) {
      return new Promise<void>((resolve) => resolve());
    }
    const keys = (ids as Array<number|string>).map(
      (id) =>
        this._getKey(id),
    );
    return this._redis.eval([
      this._luaGetMultipleDel(),
      ids.length,
      ...keys,
    ]);
  }

  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param cacheOptions Cache options.
   * @returns Promise of entities cached.
   */
  public mUpdate(
    entities: TEntity[],
    cacheOptions: ICacheOptions = new CacheOptions(),
  ): Promise<any> {
    if (null == entities || 0 === entities.length) {
      return new Promise<void>((resolve) => resolve());
    }
    if (CacheMode.NoCache === cacheOptions.cacheOptions) {
      return new Promise<void>((resolve) => resolve());
    }
    if (CacheMode.CacheIfNotExist === cacheOptions.cacheOptions) {
      throw new Error('This version does not support to cache multiple entities only if they are not cached :(.');
    }
    if (CacheMode.CacheAndOverwrite !== cacheOptions.cacheOptions) {
      throw new Error('Unexpected cache options.');
    }

    const idField = this.model.id;

    if (cacheOptions.ttl) {
      return this._redis.eval([
        this._luaGetMultipleSetEx(),
        entities.length,
        ...entities.map((entity) => this._getKey(entity[idField])),
        ...entities.map((entity) => JSON.stringify(entity)),
        cacheOptions.ttl,
      ]);
    } else {
      const cacheMap = new Map<string, string>();
      for (const entity of entities) {
        cacheMap.set(
          this._getKey(entity[idField]),
          JSON.stringify(entity),
        );
      }
      return (this._redis.mset as unknown as (map: Map<string, string>) => Promise<any>)(cacheMap);
    }
  }

  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param cacheOptions Cache options.
   * @returns Promise of redis operation ended
   */
  public update(
    entity: TEntity,
    cacheOptions: ICacheOptions = new CacheOptions(),
  ): Promise<any> {
    if (null == entity) {
      return new Promise((resolve) => resolve());
    }
    if (CacheMode.NoCache === cacheOptions.cacheOptions) {
      return new Promise((resolve) => resolve());
    }
    const key = this._getKey(entity[this.model.id]);
    switch (cacheOptions.cacheOptions) {
      case CacheMode.CacheIfNotExist:
        return this._redis.setnx(key, JSON.stringify(entity));
      case CacheMode.CacheAndOverwrite:
        return this._redis.set(key, JSON.stringify(entity));
      default:
        throw new Error('Unexpected cache options.');
    }
  }

  /**
   * Gets the key of an entity.
   * @param id entity's id.
   */
  protected _getKey(id: number|string): string {
    const keyGen = this.model.keyGen;
    return (keyGen.prefix || '')
      + id
      + (keyGen.suffix || '');
  }

  /**
   * Gets the script for deleting multiple keys.
   * @returns Lua script.
   */
  protected _luaGetMultipleDel(): string {
    return `for i=1, #KEYS do
  redis.call('del', KEYS[i])
end`;
  }

  /**
   * Gets the script for setting multiple keys with a TTL value.
   * @param ttl TTL to apply.
   * @returns generated script.
   */
  protected _luaGetMultipleSetEx(): string {
    return `local ttl = ARGV[#ARGV]
for i=1, #KEYS do
  redis.call('setex', KEYS[i], ttl, ARGV[i])
end`;
  }

  /**
   * Gets an entity by its id.
   * @param id Entity's id.
   * @param cacheOptions Cache options.
   */
  protected async _innerGetById(
    id: number|string,
    cacheOptions: ICacheOptions,
  ): Promise<TEntity> {
    if (null == id) {
      return null;
    }
    const cachedEntity = await this._redis.get(this._getKey(id));
    if (cachedEntity) {
      return JSON.parse(cachedEntity);
    }
    if (!this._successor) {
      return null;
    }
    return this._successor.getById(id).then((entity) => {
      this.update(entity, cacheOptions);
      return entity;
    });
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param idsAreDifferent True if the ids are different.
   * @param cacheOptions Cache options.
   * @returns Entities found.
   */
  protected async _innerGetByIds(
    ids: number[]|string[],
    cacheOptions: ICacheOptions,
  ): Promise<TEntity[]> {
    if (0 === ids.length) {
      return new Promise((resolve) => { resolve(new Array()); });
    }
    return this._innerGetByDistinctIdsNotMapped(
      // Get the different ones.
      (Array.from(new Set<number|string>(ids)) as number[]|string[]),
      cacheOptions,
    );
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param cacheOptions Cache options.
   * @returns Entities found.
   */
  protected async _innerGetByDistinctIdsNotMapped(
    ids: number[]|string[],
    cacheOptions: ICacheOptions,
  ): Promise<TEntity[]> {
    const keysArray = (ids as Array<number|string>).map((id) => this._getKey(id));
    const entities: string[] = await this._redis.mget(...keysArray);
    const cacheResults: TEntity[] = entities.map((entity) => JSON.parse(entity));
    const results = new Array<TEntity>();
    const missingIds = new Array();

    for (let i = 0; i < keysArray.length; ++i) {
      if (null == cacheResults[i]) {
        missingIds.push(ids[i]);
      } else {
        results.push(cacheResults[i]);
      }
    }

    if (this._successor && missingIds.length > 0) {
      const missingData = await this._successor.getByIds(missingIds);
      this.mUpdate(missingData, cacheOptions);
      for (const missingEntity of missingData) {
        results.push(missingEntity);
      }
    }

    return results;
  }

  /**
   * Creates a function that creates a lua script to create an entity key from an id.
   * @param keyGenParams Key generation params.
   */
  protected _innerGetKeyGenerationLuaScriptGenerator(keyGenParams: IKeyGenParams) {
    const instructions = new Array<(alias: string) => string>();
    if (null != keyGenParams.prefix && '' !== keyGenParams.prefix) {
      instructions.push(() => '"' + keyGenParams.prefix + '" .. ');
    }
    instructions.push((alias) => alias);
    if (null != keyGenParams.suffix && '' !== keyGenParams.suffix) {
      instructions.push(() => ' .. "' + keyGenParams.suffix + '"');
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
