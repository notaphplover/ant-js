import * as _ from 'lodash';
import { CacheMode } from '../options/cache-mode';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PersistencySearchOptions } from '../options/persistency-search-options';
import { PersistencyUpdateOptions } from '../options/persistency-update-options';
import { PrimaryEntityManager } from './primary-entity-manager';
import { RedisMiddleware } from './redis-middleware';
import { VOID_RESULT_STRING } from './lua-constants';
import { luaKeyGenerator } from './lua-key-generator';

export class AntPrimaryEntityManager<TEntity extends Entity> implements PrimaryEntityManager<TEntity> {
  /**
   * Lua expression generator.
   */
  protected _luaKeyGeneratorFromId: (alias: string) => string;
  /**
   * Model managed.
   */
  protected _model: Model<TEntity>;
  /**
   * True to use negative entity cache.
   */
  protected _negativeCache: boolean;
  /**
   * Redis connection.
   */
  protected _redis: RedisMiddleware;

  /**
   * Creates a new primary model manager.
   * @param keyGenParams Key generation params.
   * @param model Model of the entities managed.
   * @param redis Redis connection.
   * @param successor Secondary entity manager.
   * @param negativeCache True to use negative entity cache.
   */
  public constructor(model: Model<TEntity>, redis: RedisMiddleware, negativeCache: boolean) {
    this._model = model;
    this._negativeCache = negativeCache;
    this._redis = redis;

    this._luaKeyGeneratorFromId = luaKeyGenerator(this.model.keyGen);
  }

  /**
   * @inheritdoc
   */
  public get negativeCache(): boolean {
    return this._negativeCache;
  }

  /**
   * Model managed.
   */
  protected get model(): Model<TEntity> {
    return this._model;
  }

  /**
   * @inheritdoc
   */
  public async cacheMiss(id: number | string, entity: TEntity, options: PersistencySearchOptions): Promise<void> {
    if (null == entity && this.negativeCache) {
      await this._deleteEntityUsingNegativeCache(id, options);
    } else {
      await this._updateEntity(entity, options);
    }
  }

  /**
   * @inheritdoc
   */
  public cacheMisses(ids: number[] | string[], entities: TEntity[], options: PersistencySearchOptions): Promise<void> {
    if (0 === ids.length) {
      return Promise.resolve();
    }
    const tasks: Promise<any>[] = [this._updateEntities(entities, options)];

    if (this.negativeCache && entities.length !== ids.length) {
      tasks.push(
        this._deleteEntitiesUsingNegativeCache(this._cacheMissesFindIdsToApplyNegativeCache(ids, entities), options),
      );
    }

    return Promise.all(tasks).then(() => undefined);
  }

  /**
   * @inheritdoc
   */
  public async get(id: number | string): Promise<TEntity> {
    if (null == id) {
      return null;
    }

    const cachedEntity = await this._redis.get(this._getKey(id));

    if (!cachedEntity) {
      return undefined;
    }

    if (VOID_RESULT_STRING === cachedEntity) {
      return null;
    } else {
      return this.model.primaryToEntity(JSON.parse(cachedEntity));
    }
  }

  /**
   * Gets a collection of entities at the primary layer by its ids.
   * @param ids Entities ids.
   * @returns Entities found.
   */
  public async mGet(ids: number[] | string[]): Promise<TEntity[]> {
    if (0 === ids.length) {
      return new Array();
    }
    const keysArray = _.map(ids as Array<number | string>, this._getKey.bind(this));
    const entities: any[] = await this._redis.mget(...keysArray);

    for (let i = 0; i < keysArray.length; ++i) {
      if (VOID_RESULT_STRING === entities[i]) {
        entities[i] = null;
      } else {
        const cacheResult = JSON.parse(entities[i]);
        if (null == cacheResult) {
          entities[i] = undefined;
        } else {
          entities[i] = cacheResult;
        }
      }
    }

    return this.model.mPrimaryToEntity(entities);
  }

  /**
   * Sets negative cache to multiple entities.
   * @param ids Ids of the entities to delete.
   * @param options Cache options.
   */
  protected _deleteEntitiesUsingNegativeCache(
    ids: number[] | string[],
    options: PersistencySearchOptions,
  ): Promise<any> {
    if (null == ids || 0 === ids.length) {
      return Promise.resolve();
    }
    if (CacheMode.CacheAndOverwrite === options.cacheMode) {
      const evalArray = [this._luaGetMultipleDeleteUsingNegativeCache(options), 0, ...ids];
      if (options.ttl) {
        evalArray.push(options.ttl);
      }
      return this._redis.eval(evalArray);
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Deletes an entity using negative cache.
   * @param id Id of the entity to be deleted.
   * @param options Cache options.
   */
  protected _deleteEntityUsingNegativeCache(id: number | string, options: PersistencySearchOptions): Promise<any> {
    if (CacheMode.CacheAndOverwrite === options.cacheMode) {
      const key = this._getKey(id);
      if (options.ttl) {
        return this._redis.set(key, VOID_RESULT_STRING, 'PX', options.ttl);
      } else {
        return this._redis.set(key, VOID_RESULT_STRING);
      }
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Gets the key of an entity.
   * @param id entity's id.
   */
  protected _getKey(id: number | string): string {
    return this.model.keyGen.prefix + JSON.stringify(id);
  }

  /**
   * Gets the script for setting negative cache to multiple entities.
   *
   * @param options Cache options.
   * @returns generated script.
   */
  protected _luaGetMultipleDeleteUsingNegativeCache(options: PersistencySearchOptions): string {
    const keyGenerator = this._luaKeyGeneratorFromId('ARGV[i]');
    const iteratorMaxValue = options.ttl ? '#ARGV - 1' : '#ARGV';
    const updateStatement = this._luaGetUpdateStatement(
      options,
      keyGenerator,
      `'${VOID_RESULT_STRING}'`,
      'ARGV[#ARGV]',
    );
    return `for i=1, ${iteratorMaxValue} do
  ${updateStatement}
end`;
  }

  /**
   * Gets the script for setting multiple keys with a TTL value.
   * @returns generated script.
   */
  protected _luaGetMultipleSetEx(): string {
    return `local ttl = ARGV[#ARGV]
for i=1, #KEYS do
  redis.call('psetex', KEYS[i], ttl, ARGV[i])
end`;
  }

  /**
   * Gets the script for setting multiple keys with NX option.
   * @returns generated script.
   */
  protected _luaGetMultipleSetNx(): string {
    return `for i=1, #KEYS do
    redis.call('set', KEYS[i], ARGV[i], 'NX')
  end`;
  }

  /**
   * Gets the script for setting multiple keys with a TTL value and NX option.
   * @returns generated script.
   */
  protected _luaGetMultipleSetNxEx(): string {
    return `local ttl = ARGV[#ARGV]
    for i=1, #KEYS do
      redis.call('set', KEYS[i], ARGV[i], 'NX', 'PX', ttl)
    end`;
  }

  /**
   * Gets the lua update statement for a certain cache options.
   * @param options Cache options.
   * @param keyExpression Entity key alias.
   * @param entityExpression Entity alias.
   * @param ttlExpression TTL expression.
   * @returns Lua update statement.
   */
  protected _luaGetUpdateStatement(
    options: PersistencyUpdateOptions,
    keyExpression: string,
    entityExpression: string,
    ttlExpression: string,
  ): string {
    switch (options.cacheMode) {
      case CacheMode.CacheAndOverwrite:
        if (options.ttl) {
          return `redis.call('set', ${keyExpression}, ${entityExpression}, 'PX', ${ttlExpression})`;
        } else {
          return `redis.call('set', ${keyExpression}, ${entityExpression})`;
        }
      case CacheMode.CacheIfNotExist:
        if (options.ttl) {
          return `redis.call('set', ${keyExpression}, ${entityExpression}, 'NX', 'PX', ${ttlExpression})`;
        } else {
          return `redis.call('set', ${keyExpression}, ${entityExpression}, 'NX')`;
        }
      case CacheMode.NoCache:
        return '';
      default:
        throw new Error('Unexpected cache mode');
    }
  }

  /**
   * Inserts params in a param vector creating an array of params to perform an special mSet at Redis.
   * @param evalParams Params vector.
   * @param primaries Primary objects to process
   * @param scriptParam Script parameter.
   */
  private _buildMultipleSetParamsBaseTransform(
    evalParams: Array<number | string>,
    primaries: any[],
    scriptParam: string,
  ): void {
    const idField = this.model.id;
    evalParams[0] = scriptParam;
    evalParams[1] = primaries.length;
    for (let i = 0; i < primaries.length; ++i) {
      const entity = primaries[i];
      const currentIndex = i + 2;
      evalParams[currentIndex] = this._getKey(entity[idField]);
      evalParams[currentIndex + primaries.length] = JSON.stringify(entity);
    }
  }

  /**
   * Creates a param array to perform an special mSet operation at Redis.
   * @param primaries Primary objects to process
   * @param scriptParam Script parameter.
   * @returns Param array.
   */
  private _buildMultipleSetParamsWithNoTtl(primaries: any[], scriptParam: string): Array<number | string> {
    const evalParams = new Array<number | string>(2 * primaries.length + 2);
    this._buildMultipleSetParamsBaseTransform(evalParams, primaries, scriptParam);
    return evalParams;
  }

  /**
   * Creates a param array to perform an special mSet operation at Redis.
   * @param primaries Primary objects to process
   * @param scriptParam Script parameter.
   * @param ttl TTL param.
   * @returns Param array.
   */
  private _buildMultipleSetParamsWithTtl(primaries: any[], scriptParam: string, ttl: number): Array<number | string> {
    const evalParams = new Array<number | string>(2 * primaries.length + 3);
    this._buildMultipleSetParamsBaseTransform(evalParams, primaries, scriptParam);
    evalParams[evalParams.length - 1] = ttl;
    return evalParams;
  }

  /**
   * Finds the ids to apply negative cache.
   *
   * Ids to apply negative cache are those from the ids params with no associated entity at entities params.
   *
   * @param ids Ids of the entities to be cached (ordered ASC).
   * @param entities Entities found (ordered by id ASC).
   * @returns Ids to apply negative cache.
   */
  private _cacheMissesFindIdsToApplyNegativeCache(ids: number[] | string[], entities: TEntity[]): number[] | string[] {
    let offset = 0;
    const idsToApplyNegativeCache: number[] | string[] = new Array();
    for (let i = 0; i < entities.length; ++i) {
      const missingDataId = entities[i][this.model.id];
      while (ids[i + offset] !== missingDataId) {
        // We found and id to delete (keep in mind that ids and entities are sorted)
        (idsToApplyNegativeCache as Array<number | string>).push(ids[i]);
        ++offset;
      }
    }
    for (let i = entities.length + offset; i < ids.length; ++i) {
      (idsToApplyNegativeCache as Array<number | string>).push(ids[i]);
    }

    return idsToApplyNegativeCache;
  }

  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param options Cache options.
   * @returns Promise of entities cached.
   */
  private _updateEntities(entities: TEntity[], options: PersistencyUpdateOptions): Promise<any> {
    if (null == entities || 0 === entities.length) {
      return Promise.resolve();
    }
    if (CacheMode.NoCache === options.cacheMode) {
      return Promise.resolve();
    }

    switch (options.cacheMode) {
      case CacheMode.CacheIfNotExist:
        return this._updateEntitiesCacheIfNotExists(entities, options);
      case CacheMode.CacheAndOverwrite:
        return this._updateEntitiesCacheAndOverWrite(entities, options);
      default:
        throw new Error('Unexpected cache options.');
    }
  }

  /**
   * Updates entities caching the new result in the cache server.
   * @param entities Entities to update.
   * @param options Cache options.
   * @returns Promise of entities cached.
   */
  private _updateEntitiesCacheAndOverWrite(entities: TEntity[], options: PersistencyUpdateOptions): Promise<any> {
    const primaries = this.model.mEntityToPrimary(entities);
    if (options.ttl) {
      return this._redis.eval(this._buildMultipleSetParamsWithTtl(primaries, this._luaGetMultipleSetEx(), options.ttl));
    } else {
      const idField = this.model.id;
      const cacheMap = new Map<string, string>();
      for (const entity of primaries) {
        cacheMap.set(this._getKey(entity[idField]), JSON.stringify(entity));
      }
      return ((this._redis.mset as unknown) as (map: Map<string, string>) => Promise<any>)(cacheMap);
    }
  }

  /**
   * Updates entities caching the new result in the cache server if no previous cached entity is found.
   * @param entities Entities to update.
   * @param options Cache options.
   * @returns Promise of entities cached if not exist.
   */
  private _updateEntitiesCacheIfNotExists(entities: TEntity[], options: PersistencyUpdateOptions): Promise<any> {
    const primaries = this.model.mEntityToPrimary(entities);
    if (null == options.ttl) {
      return this._redis.eval(this._buildMultipleSetParamsWithNoTtl(primaries, this._luaGetMultipleSetNx()));
    } else {
      return this._redis.eval(
        this._buildMultipleSetParamsWithTtl(primaries, this._luaGetMultipleSetNxEx(), options.ttl),
      );
    }
  }

  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param options Cache options.
   * @returns Promise of redis operation ended
   */
  private _updateEntity(entity: TEntity, options: PersistencyUpdateOptions): Promise<any> {
    if (CacheMode.NoCache === options.cacheMode) {
      return Promise.resolve();
    }
    if (null == entity) {
      return Promise.resolve();
    }
    const key = this._getKey(entity[this.model.id]);
    switch (options.cacheMode) {
      case CacheMode.CacheIfNotExist:
        if (null == options.ttl) {
          return this._redis.set(key, JSON.stringify(this.model.entityToPrimary(entity)), 'NX');
        } else {
          return this._redis.set(key, JSON.stringify(this.model.entityToPrimary(entity)), 'PX', options.ttl, 'NX');
        }
      case CacheMode.CacheAndOverwrite:
        if (null == options.ttl) {
          return this._redis.set(key, JSON.stringify(this.model.entityToPrimary(entity)));
        } else {
          return this._redis.set(key, JSON.stringify(this.model.entityToPrimary(entity)), 'PX', options.ttl);
        }
      default:
        throw new Error('Unexpected cache options.');
    }
  }
}
