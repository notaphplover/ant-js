import { IEntity } from '../../model/IEntity';
import { IKeyGenParams } from '../../model/IKeyGenParams';
import { IModel } from '../../model/IModel';
import { ISecondaryEntityManager } from '../secondary/ISecondaryEntityManager';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
import { IRedisMiddleware } from './IRedisMiddleware';
import { VOID_RESULT_STRING } from './LuaConstants';
import { AntJsSearchOptions } from './options/AntJsSearchOptions';
import { CacheMode } from './options/CacheMode';
import { IPersistencySearchOptions } from './options/IPersistencySearchOptions';
import { IPersistencyUpdateOptions } from './options/IPersistencyUpdateOptions';

export class PrimaryEntityManager<
  TEntity extends IEntity,
  TSecondaryManager extends ISecondaryEntityManager<TEntity>
> implements IPrimaryEntityManager<TEntity> {

  /**
   * Lua expression generator.
   */
  protected _luaKeyGeneratorFromId: (alias: string) => string;
  /**
   * Model managed.
   */
  protected _model: IModel;
  /**
   * True to use negative entity cache.
   */
  protected _negativeEntityCache: boolean;
  /**
   * Redis connection.
   */
  protected _redis: IRedisMiddleware;
  /**
   * Secondary model manager of the model.
   */
  protected _successor: TSecondaryManager;

  /**
   * Creates a new primary model manager.
   * @param keyGenParams Key generation params.
   * @param model Model of the entities managed.
   * @param redis Redis connection.
   * @param successor Secondary entity manager.
   * @param negativeEntityCache True to use negative entity cache.
   */
  public constructor(
    model: IModel,
    redis: IRedisMiddleware,
    negativeEntityCache: boolean,
    successor?: TSecondaryManager,
  ) {
    this._model = model;
    this._negativeEntityCache = negativeEntityCache;
    this._redis = redis;
    this._successor = successor;

    this._luaKeyGeneratorFromId = this._innerGetKeyGenerationLuaScriptGenerator(this.model.keyGen);
  }

  /**
   * Model managed.
   */
  public get model(): IModel {
    return this._model;
  }

  /**
   * Gets an entity by its id.
   * @param id: Entity's id.
   * @returns Model found.
   */
  public get(
    id: number|string,
    options: IPersistencySearchOptions = new AntJsSearchOptions(),
  ): Promise<TEntity> {
    return this._innerGetById(id, options);
  }

  /**
   * Gets the lua key generator from id.
   * @returns Lua key generator
   */
  public getLuaKeyGeneratorFromId(): (alias: string) => string {
    return this._luaKeyGeneratorFromId;
  }

  /**
   * Gets a collection of entities by its ids.
   * @param ids Entities ids.
   * @returns Entities found.
   */
  public mGet(
    ids: number[] | string[],
    options: IPersistencySearchOptions = new AntJsSearchOptions(),
  ): Promise<TEntity[]> {
    return this._innerGetByIds(ids, options);
  }

  /**
   * Sets negative cache to multiple entities.
   * @param ids Ids of the entities to delete.
   * @param options Cache options.
   */
  protected _deleteEntitiesUsingNegativeCache(
    ids: number[] | string[],
    options: IPersistencySearchOptions,
  ): Promise<any> {
    if (null == ids || 0 === ids.length) {
      return new Promise((resolve) => resolve());
    }
    if (CacheMode.CacheAndOverwrite === options.cacheMode) {
      const evalArray = [
        this._luaGetMultipleDeleteUsingNegativeCache(options),
        0,
        ...ids,
      ];
      if (options.ttl) {
        evalArray.push(options.ttl);
      }
      return this._redis.eval(evalArray);
    } else {
      return new Promise((resolve) => resolve());
    }
  }

  /**
   * Deletes an entity using negative cache.
   * @param id Id of the entity to be deleted.
   * @param options Cache options.
   */
  protected _deleteEntityUsingNegativeCache(
    id: number|string,
    options: IPersistencySearchOptions,
  ): Promise<any> {
    if (CacheMode.CacheAndOverwrite === options.cacheMode) {
      const key = this._getKey(id);
      if (options.ttl) {
        return this._redis.set(key, VOID_RESULT_STRING, 'PX', options.ttl);
      } else {
        return this._redis.set(key, VOID_RESULT_STRING);
      }
    } else {
      return new Promise((resolve) => resolve());
    }
  }

  /**
   * Evaluates search options in order of determining if negative cache should be used.
   * @param options Search options to evaluate.
   * @returns True if negative cache should be used.
   */
  protected _evaluateUseNegativeCache(options: IPersistencySearchOptions): boolean {
    return options.negativeCache || this._negativeEntityCache;
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
   * Gets an entity by its id.
   * @param id Entity's id.
   * @param options Cache options.
   */
  protected async _innerGetById(
    id: number|string,
    options: IPersistencySearchOptions,
  ): Promise<TEntity> {
    if (null == id) {
      return null;
    }
    const cachedEntity = await this._redis.get(this._getKey(id));
    if (cachedEntity) {
      if (VOID_RESULT_STRING === cachedEntity) {
        return null;
      } else {
        return JSON.parse(cachedEntity);
      }
    }
    if (!this._successor) {
      return null;
    }
    return this._successor.getById(id).then((entity) => {
      if (null == entity && this._evaluateUseNegativeCache(options)) {
        this._deleteEntityUsingNegativeCache(id, options);
        return null;
      } else {
        this._updateEntity(entity, options);
        return entity;
      }
    });
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param idsAreDifferent True if the ids are different.
   * @param options Cache options.
   * @returns Entities found.
   */
  protected async _innerGetByIds(
    ids: number[]|string[],
    options: IPersistencySearchOptions,
  ): Promise<TEntity[]> {
    if (0 === ids.length) {
      return new Promise((resolve) => { resolve(new Array()); });
    }
    return this._innerGetByDistinctIdsNotMapped(
      // Get the different ones.
      ids,
      options,
    );
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param options Cache options.
   * @returns Entities found.
   */
  protected async _innerGetByDistinctIdsNotMapped(
    ids: number[]|string[],
    options: IPersistencySearchOptions,
  ): Promise<TEntity[]> {
    ids = Array.from(new Set<number|string>(ids)) as number[]|string[];
    const keysArray = (ids as Array<number|string>).map((id) => this._getKey(id));
    const entities: string[] = await this._redis.mget(...keysArray);
    const results = new Array<TEntity>();
    const missingIds: number[] | string[] = new Array();

    for (let i = 0; i < keysArray.length; ++i) {
      if (VOID_RESULT_STRING === entities[i]) {
        continue;
      }
      const cacheResult = JSON.parse(entities[i]);
      if (null == cacheResult) {
        missingIds.push(ids[i] as number&string);
      } else {
        results.push(cacheResult);
      }
    }

    await this._innerGetByDistinctIdsNotMappedProcessMissingIds(
      missingIds,
      results,
      options,
    );

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

  /**
   * Gets the script for setting negative cache to multiple entities.
   *
   * @param options Cache options.
   * @returns generated script.
   */
  protected _luaGetMultipleDeleteUsingNegativeCache(options: IPersistencySearchOptions): string {
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
    options: IPersistencyUpdateOptions,
    keyExpression: string,
    entityExpression: string,
    ttlExpression: string = 'ttl',
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
   * Process missing ids.
   * @param missingIds Missing ids to process.
   * @param results Results array.
   * @param options Cache options.
   */
  private async _innerGetByDistinctIdsNotMappedProcessMissingIds(
    missingIds: number[] | string[],
    results: TEntity[],
    options: IPersistencySearchOptions,
  ): Promise<void> {
    if (this._successor && missingIds.length > 0) {
      let missingData: TEntity[];
      if (this._evaluateUseNegativeCache(options)) {
        missingData = await this._successor.getByIdsOrderedAsc(missingIds);
        if (missingData.length === missingIds.length) {
          this._updateEntities(missingData, options);
        } else {
          const sortedIds = 'number' === typeof missingIds[0] ?
            (missingIds as number[]).sort((a: number, b: number) => a - b) :
            missingIds.sort();
          let offset = 0;
          const idsToApplyNegativeCache: number[] | string[] = new Array();
          for (let i = 0; i < missingData.length; ++i) {
            const missingDataId = missingData[i][this.model.id];
            if (sortedIds[i + offset] !== missingDataId) {
              idsToApplyNegativeCache.push(sortedIds[i] as number & string);
              ++offset;
              --i;
            }
          }
          for (let i = missingData.length + offset; i <  sortedIds.length; ++i) {
            idsToApplyNegativeCache.push(sortedIds[i] as number&string);
          }
          this._deleteEntitiesUsingNegativeCache(idsToApplyNegativeCache, options);
        }
      } else {
        missingData = await this._successor.getByIds(missingIds);
        this._updateEntities(missingData, options);
      }
      for (const missingEntity of missingData) {
        results.push(missingEntity);
      }
    }
  }

  /**
   * Cache multiple entities.
   * @param entities Entities to cache.
   * @param options Cache options.
   * @returns Promise of entities cached.
   */
  private _updateEntities(
    entities: TEntity[],
    options: IPersistencyUpdateOptions,
  ): Promise<any> {
    if (null == entities || 0 === entities.length) {
      return new Promise<void>((resolve) => resolve());
    }
    if (CacheMode.NoCache === options.cacheMode) {
      return new Promise<void>((resolve) => resolve());
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
  private _updateEntitiesCacheAndOverWrite(
    entities: TEntity[],
    options: IPersistencyUpdateOptions,
  ): Promise<any> {
    const idField = this.model.id;
    if (options.ttl) {
      return this._redis.eval([
        this._luaGetMultipleSetEx(),
        entities.length,
        ...entities.map((entity) => this._getKey(entity[idField])),
        ...entities.map((entity) => JSON.stringify(entity)),
        options.ttl,
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
   * Updates entities caching the new result in the cache server if no previous cached entity is found.
   * @param entities Entities to update.
   * @param options Cache options.
   * @returns Promise of entities cached if not exist.
   */
  private _updateEntitiesCacheIfNotExists(
    entities: TEntity[],
    options: IPersistencyUpdateOptions,
  ): Promise<any> {
    const idField = this.model.id;
    if (null == options.ttl) {
      return this._redis.eval([
        this._luaGetMultipleSetNx(),
        entities.length,
        ...entities.map((entity) => this._getKey(entity[idField])),
        ...entities.map((entity) => JSON.stringify(entity)),
      ]);
    } else {
      return this._redis.eval([
        this._luaGetMultipleSetNxEx(),
        entities.length,
        ...entities.map((entity) => this._getKey(entity[idField])),
        ...entities.map((entity) => JSON.stringify(entity)),
        options.ttl,
      ]);
    }
  }

  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param options Cache options.
   * @returns Promise of redis operation ended
   */
  private _updateEntity(
    entity: TEntity,
    options: IPersistencyUpdateOptions,
  ): Promise<any> {
    if (CacheMode.NoCache === options.cacheMode) {
      return new Promise((resolve) => resolve());
    }
    if (null == entity) {
      return new Promise((resolve) => resolve());
    }
    const key = this._getKey(entity[this.model.id]);
    switch (options.cacheMode) {
      case CacheMode.CacheIfNotExist:
        if (null == options.ttl) {
          return this._redis.set(key, JSON.stringify(entity), 'NX');
        } else {
          return this._redis.set(key, JSON.stringify(entity), 'PX', options.ttl, 'NX');
        }
      case CacheMode.CacheAndOverwrite:
        if (null == options.ttl) {
          return this._redis.set(key, JSON.stringify(entity));
        } else {
          return this._redis.set(key, JSON.stringify(entity), 'PX', options.ttl);
        }
      default:
        throw new Error('Unexpected cache options.');
    }
  }
}
