import * as _ from 'lodash';
import { CacheMode } from './options/cache-mode';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PersistencyDeleteOptions } from './options/persistency-delete-options';
import { PersistencySearchOptions } from './options/persistency-search-options';
import { PersistencyUpdateOptions } from './options/persistency-update-options';
import { PrimaryEntityManager } from './primary-entity-manager';
import { RedisMiddleware } from './redis-middleware';
import { SecondaryEntityManager } from '../secondary/secondary-entity-manager';
import { VOID_RESULT_STRING } from './lua-constants';
import { luaKeyGenerator } from './lua-key-generator';

export class AntPrimaryEntityManager<TEntity extends Entity, TSecondaryManager extends SecondaryEntityManager<TEntity>>
  implements PrimaryEntityManager<TEntity> {
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
  protected _negativeEntityCache: boolean;
  /**
   * Redis connection.
   */
  protected _redis: RedisMiddleware;
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
    model: Model<TEntity>,
    redis: RedisMiddleware,
    negativeEntityCache: boolean,
    successor?: TSecondaryManager,
  ) {
    this._model = model;
    this._negativeEntityCache = negativeEntityCache;
    this._redis = redis;
    this._successor = successor;

    this._luaKeyGeneratorFromId = luaKeyGenerator(this.model.keyGen);
  }

  /**
   * Model managed.
   */
  protected get model(): Model<TEntity> {
    return this._model;
  }

  /**
   * Gets an entity by its id.
   * @param id: Entity's id.
   * @returns Model found.
   */
  public get(id: number | string, options: PersistencySearchOptions): Promise<TEntity> {
    if (options.ignorePrimaryLayer) {
      if (options.ignoreSecondaryLayer) {
        return Promise.resolve(null);
      } else {
        return this._successor.getById(id);
      }
    } else {
      if (options.ignoreSecondaryLayer) {
        throw new Error('this configuration is not currently supported');
      } else {
        return this._innerGetById(id, options);
      }
    }
  }

  /**
   * Gets a collection of entities by its ids.
   * @param ids Entities ids.
   * @returns Entities found.
   */
  public mGet(ids: number[] | string[], options: PersistencySearchOptions): Promise<TEntity[]> {
    if (options.ignorePrimaryLayer) {
      if (options.ignoreSecondaryLayer) {
        return Promise.resolve(new Array());
      } else {
        return this._successor.getByIds(ids);
      }
    } else {
      if (options.ignoreSecondaryLayer) {
        throw new Error('this configuration is not currently supported');
      } else {
        return this._innerGetByIds(ids, options);
      }
    }
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
   * Evaluates search options in order of determining if negative cache should be used.
   * @param options Search options to evaluate.
   * @returns True if negative cache should be used.
   */
  protected _evaluateUseNegativeCache(options: PersistencyDeleteOptions): boolean {
    return options.negativeCache || this._negativeEntityCache;
  }

  /**
   * Gets the key of an entity.
   * @param id entity's id.
   */
  protected _getKey(id: number | string): string {
    return this.model.keyGen.prefix + id;
  }

  /**
   * Gets an entity by its id.
   * @param id Entity's id.
   * @param options Cache options.
   */
  protected async _innerGetById(id: number | string, options: PersistencySearchOptions): Promise<TEntity> {
    if (null == id) {
      return null;
    }
    const cachedEntity = await this._redis.get(this._getKey(id));
    if (cachedEntity) {
      if (VOID_RESULT_STRING === cachedEntity) {
        return null;
      } else {
        return this.model.primaryToEntity(JSON.parse(cachedEntity));
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
  protected async _innerGetByIds(ids: number[] | string[], options: PersistencySearchOptions): Promise<TEntity[]> {
    if (0 === ids.length) {
      return Promise.resolve(new Array());
    }
    return this._innerGetByDistinctIdsNotMapped(ids, options);
  }

  /**
   * Gets entities by its ids.
   * @param ids Entities ids.
   * @param options Cache options.
   * @returns Entities found.
   */
  protected async _innerGetByDistinctIdsNotMapped(
    ids: number[] | string[],
    options: PersistencySearchOptions,
  ): Promise<TEntity[]> {
    // Get the different ones.
    ids = Array.from(new Set<number | string>(ids)) as number[] | string[];
    const keysArray = _.map(ids as Array<number | string>, this._getKey.bind(this));
    const entities: string[] = await this._redis.mget(...keysArray);
    let results = new Array<TEntity>();
    const missingIds: number[] | string[] = new Array();

    for (let i = 0; i < keysArray.length; ++i) {
      if (VOID_RESULT_STRING === entities[i]) {
        continue;
      }
      const cacheResult = JSON.parse(entities[i]);
      if (null == cacheResult) {
        missingIds.push(ids[i] as number & string);
      } else {
        results.push(cacheResult);
      }
    }

    results = this.model.mPrimaryToEntity(results);

    await this._innerGetByDistinctIdsNotMappedProcessMissingIds(missingIds, results, options);

    return results;
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
   * Process missing ids.
   * @param missingIds Missing ids to process.
   * @param results Results array.
   * @param options Cache options.
   */
  private async _innerGetByDistinctIdsNotMappedProcessMissingIds(
    missingIds: number[] | string[],
    results: TEntity[],
    options: PersistencySearchOptions,
  ): Promise<void> {
    if (this._successor && missingIds.length > 0) {
      let missingData: TEntity[];
      if (this._evaluateUseNegativeCache(options)) {
        missingData = await this._successor.getByIdsOrderedAsc(missingIds);
        if (missingData.length === missingIds.length) {
          this._updateEntities(missingData, options);
        } else {
          const sortedIds =
            'number' === typeof missingIds[0]
              ? (missingIds as number[]).sort((a: number, b: number) => a - b)
              : missingIds.sort();
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
          for (let i = missingData.length + offset; i < sortedIds.length; ++i) {
            idsToApplyNegativeCache.push(sortedIds[i] as number & string);
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
