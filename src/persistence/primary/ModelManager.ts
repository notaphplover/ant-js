import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ISecondaryEntityManager } from '../secondary/ISecondaryEntityManager';
import { IModelManager } from './IModelManager';
import { IRedisMiddleware } from './IRedisMiddleware';
import {
  MULTIPLE_RESULT_QUERY_CODE,
  SINGLE_RESULT_QUERY_CODE,
  VOID_RESULT_STRING,
} from './LuaConstants';
import { AntJsUpdateOptions } from './options/AntJsUpdateOptions';
import { IPersistencyUpdateOptions } from './options/IPersistencyUpdateOptions';
import { PrimaryEntityManager } from './PrimaryEntityManager';
import { IPrimaryQueryManager } from './query/IPrimaryQueryManager';
import { RedisCachedScript } from './script/RedisCachedScript';
import { RedisCachedScriptSetByCacheMode } from './script/RedisCachedScriptSetByCacheMode';

export class ModelManager<
  TEntity extends IEntity,
  TSecondaryManager extends ISecondaryEntityManager<TEntity>
> extends PrimaryEntityManager<TEntity, TSecondaryManager> implements IModelManager<TEntity> {

  /**
   * Cached script for deleting an entity.
   */
  protected _luaDeleteCachedQuery: RedisCachedScript;
  /**
   * Cached script for deleting multiple entities.
   */
  protected _luaMDeleteCachedQuery: RedisCachedScript;
  /**
   * Cached script set for updating multiple entities.
   */
  protected _luaMUpdateCachedQuerySet: RedisCachedScriptSetByCacheMode;
  /**
   * Cached script set for updating an entity.
   */
  protected _luaUpdateCachedQuerySet: RedisCachedScriptSetByCacheMode;

  /**
   * Query managers.
   */
  protected _queryManagers: Array<IPrimaryQueryManager<TEntity>>;

  /**
   * Creates a new model manager.
   * @param model Model managed.
   * @param redis Redis connection.
   * @param negativeEntityCache True to use negative entity cache.
   * @param secondaryEntityManager Secondary entity manager.
   * @param queryManagers Query managers.
   */
  public constructor(
    model: IModel,
    redis: IRedisMiddleware,
    negativeEntityCache: boolean,
    secondaryEntityManager?: TSecondaryManager,
  ) {
    super(
      model,
      redis,
      negativeEntityCache,
      secondaryEntityManager,
    );

    this._initializeCachedQueries();

    this._queryManagers = new Array();
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
   * Returns the queries managed.
   * @returns Queries managed.
   */
  public getQueries(): Array<IPrimaryQueryManager<TEntity>> {
    return Object.assign(new Array(), this._queryManagers);
  }

  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @returns Promise of entity deleted.
   */
  public delete(id: number|string): Promise<any> {
    return this._luaDeleteCachedQuery.eval((scriptArg: string) => {
      const evalParams = [
        scriptArg,
        this._queryManagers.length,
      ];
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.reverseHashKey);
      }
      evalParams.push(JSON.stringify(id));
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.isMultiple ? MULTIPLE_RESULT_QUERY_CODE : SINGLE_RESULT_QUERY_CODE);
      }
      return evalParams;
    });
  }

  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @returns Promise of entities deleted.
   */
  public mDelete(ids: number[]|string[]): Promise<any> {
    if (null == ids || 0 === ids.length) {
      return new Promise((resolve) => resolve());
    }
    return this._luaMDeleteCachedQuery.eval((scriptArg) => {
      const evalParams = [
        scriptArg,
        this._queryManagers.length,
      ];
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.reverseHashKey);
      }
      for (const id of ids) {
        evalParams.push(JSON.stringify(id));
      }
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.isMultiple ? MULTIPLE_RESULT_QUERY_CODE : SINGLE_RESULT_QUERY_CODE);
      }
      return evalParams;
    });
  }

  /**
   * Updates multiple entities at the cache layer.
   * @param entities Entities to be updated.
   * @param options Cache options.
   * @returns Promise of entities updated.
   */
  public mUpdate(
    entities: TEntity[],
    options: IPersistencyUpdateOptions = new AntJsUpdateOptions(),
  ): Promise<any> {
    if (null == entities || 0 === entities.length) {
      return new Promise((resolve) => resolve());
    }
    return this._luaMUpdateCachedQuerySet.eval(options, (scriptArg) => {
      const evalParams = [
        scriptArg,
        this._queryManagers.length * (entities.length + 1),
      ];
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.reverseHashKey);
        for (const entity of entities) {
          evalParams.push(queryManager.entityKeyGen(entity));
        }
      }
      for (const entity of entities) {
        evalParams.push(entity[this._model.id]);
      }
      for (const entity of entities) {
        evalParams.push(JSON.stringify(entity));
      }
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.isMultiple ? MULTIPLE_RESULT_QUERY_CODE : SINGLE_RESULT_QUERY_CODE);
      }
      evalParams.push(this._queryManagers.length);
      if (options.ttl) {
        evalParams.push(options.ttl);
      }
      return evalParams;
    });
  }

  /**
   * Updates an entity at the cache layer.
   * @param entity Entity to be updated.
   * @param options Cache options.
   * @returns Promise of entity updated.
   */
  public update(
    entity: TEntity,
    options: IPersistencyUpdateOptions = new AntJsUpdateOptions(),
  ): Promise<any> {
    return this._luaUpdateCachedQuerySet.eval(options, (scriptArg) => {
      const evalParams = [
        scriptArg,
        2 * this._queryManagers.length,
      ];
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.reverseHashKey);
        evalParams.push(queryManager.entityKeyGen(entity));
      }
      evalParams.push(JSON.stringify(entity[this._model.id]));
      evalParams.push(JSON.stringify(entity));
      if (options.ttl) {
        evalParams.push(options.ttl);
      }
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.isMultiple ? MULTIPLE_RESULT_QUERY_CODE : SINGLE_RESULT_QUERY_CODE);
      }
      return evalParams;
    });
  }

  /**
   * Initializes all the cached queries managed by the instance.
   */
  private _initializeCachedQueries(): void {
    this._luaDeleteCachedQuery = new RedisCachedScript(
      this._luaSyncDeleteGenerator(),
      this._redis,
    );
    this._luaMDeleteCachedQuery = new RedisCachedScript(
      this._luaSyncMDeleteGenerator(),
      this._redis,
    );
    this._luaMUpdateCachedQuerySet = new RedisCachedScriptSetByCacheMode(
      (options) => new RedisCachedScript(
        this._luaSyncMUpdateGenerator(options),
        this._redis,
      ),
    );
    this._luaUpdateCachedQuerySet = new RedisCachedScriptSetByCacheMode(
      (options) => new RedisCachedScript(
        this._luaSyncUpdateGenerator(options),
        this._redis,
      ),
    );
  }

  /**
   * Generates a lua script to delete an entity in the cache server.
   * This script also updates al the queries related to the entity.
   *
   * @returns script generated.
   */
  private _luaSyncDeleteGenerator(): string {
    const reverseHashKey: string = 'KEYS[i]';

    const entityId: string = 'ARGV[1]';
    const entityKey: string = this._luaKeyGeneratorFromId(entityId);
    const queriesNumber: string = '#KEYS';
    const ithQCode: string = 'ARGV[1 + i]';

    const deleteSentence = this._negativeEntityCache ?
      `redis.call('set', ${entityKey}, '${VOID_RESULT_STRING}')` :
      `redis.call('del', ${entityKey})`;

    return `for i=1, ${queriesNumber} do
  local qCode = ${ithQCode}
  if '${SINGLE_RESULT_QUERY_CODE}' == qCode then
    local key = redis.call('hget', ${reverseHashKey}, ${entityId})
    if key then
      redis.call('set', key, '${VOID_RESULT_STRING}')
      redis.call('hdel', ${reverseHashKey}, ${entityId})
    end
  else
    if '${MULTIPLE_RESULT_QUERY_CODE}' == qCode then
      local key = redis.call('hget', ${reverseHashKey}, ${entityId})
      if key then
        redis.call('srem', key, ${entityId})
        if 0 == redis.call('scard', key) then
          redis.call('sadd', key, '${VOID_RESULT_STRING}')
        end
        redis.call('hdel', ${reverseHashKey}, ${entityId})
      end
    end
  end
end
${deleteSentence}`;
  }

  /**
   * Generates a lua script to delete multiple entities in the cache server.
   * This script also updates al the queries related to the entities.
   *
   * @returns script generated.
   */
  private _luaSyncMDeleteGenerator(): string {
    const queriesNumber: string = '#KEYS';
    const entitiesCount = '#ARGV - #KEYS';
    const ithQCode = 'ARGV[entitiesCount + i]';
    const ithReverseKey = 'KEYS[i]';
    const jthEntityId = 'ARGV[j]';
    const jthEntityKey: string = this._luaKeyGeneratorFromId(jthEntityId);

    const deleteSentence = this._negativeEntityCache ?
      `redis.call('set', ${jthEntityKey}, '${VOID_RESULT_STRING}')` :
      `redis.call('del', ${jthEntityKey})`;

    return `local entitiesCount = ${entitiesCount}
for i=1, ${queriesNumber} do
  local qCode = ${ithQCode}
  if '${SINGLE_RESULT_QUERY_CODE}' == qCode then
    local reverseKey = ${ithReverseKey}
    for j=1, entitiesCount do
      local key = redis.call('hget', reverseKey, ${jthEntityId})
      if key then
        redis.call('set', key, '${VOID_RESULT_STRING}')
        redis.call('hdel', reverseKey, ${jthEntityId})
      end
    end
  else
    if '${MULTIPLE_RESULT_QUERY_CODE}' == qCode then
      local reverseKey = ${ithReverseKey}
      for j=1, entitiesCount do
        local key = redis.call('hget', reverseKey, ${jthEntityId})
        if key then
          redis.call('srem', key, ${jthEntityId})
          if 0 == redis.call('scard', key) then
            redis.call('sadd', key, '${VOID_RESULT_STRING}')
          end
          redis.call('hdel', reverseKey, ${jthEntityId})
        end
      end
    end
  end
end
for j=1, entitiesCount do
  ${deleteSentence}
end`;
  }

  /**
   * Generates a lua script to update multiple entities in the cache server.
   * This script also updates al the queries related to the entities.
   *
   * @param options Cache options.
   * @returns script generated.
   */
  private _luaSyncMUpdateGenerator(options: IPersistencyUpdateOptions): string {
    const ttl = 'ARGV[#ARGV]';
    const queriesNumber: string = options.ttl ? 'ARGV[#ARGV - 1]' : 'ARGV[#ARGV]';
    const entitiesCount = options.ttl ? '(#ARGV - queriesNumber) / 2 - 1' : '(#ARGV - queriesNumber - 1) / 2';
    const ithQCode = 'ARGV[2 * entitiesCount + i]';
    const ithReverseKeyIndex = '(entitiesCount + 1) * (i - 1) + 1';
    const ithReverseKey = 'KEYS[ithReverseKeyIndex]';
    const jthEntity = 'ARGV[entitiesCount + j]';
    const jthEntityId = 'ARGV[j]';
    const jthEntityKey: string = this._luaKeyGeneratorFromId(jthEntityId);
    const jthQueryKeyIndex = 'ithReverseKeyIndex + j';
    const jthQueryKey = 'KEYS[jthQueryKeyIndex]';

    const updateStatement = this._luaGetUpdateStatement(options, jthEntityKey, jthEntity, ttl);

    return `local queriesNumber = ${queriesNumber}
local entitiesCount = ${entitiesCount}
for i=1, queriesNumber do
  local qCode = ${ithQCode}
  local ithReverseKeyIndex = ${ithReverseKeyIndex}
  if '${SINGLE_RESULT_QUERY_CODE}' == qCode then
    local reverseKey = ${ithReverseKey}
    for j=1, entitiesCount do
      local key = redis.call('hget', reverseKey, ${jthEntityId})
      if key then
        redis.call('set', key, '${VOID_RESULT_STRING}')
      end
      local jthQueryKeyIndex = ${jthQueryKeyIndex}
      local queryKey = ${jthQueryKey}
      redis.call('hset', reverseKey, ${jthEntityId}, queryKey);
      redis.call('set', queryKey, ${jthEntityId})
    end
  else
    if '${MULTIPLE_RESULT_QUERY_CODE}' == qCode then
      local reverseKey = ${ithReverseKey}
      for j=1, entitiesCount do
        local key = redis.call('hget', reverseKey, ${jthEntityId})
        if key then
          redis.call('srem', key, ${jthEntityId})
          if 0 == redis.call('scard', key) then
            redis.call('sadd', key, '${VOID_RESULT_STRING}')
          end
        end
        local jthQueryKeyIndex = ${jthQueryKeyIndex}
        local queryKey = ${jthQueryKey}
        if 0 == redis.call('scard', queryKey) then
          redis.call('hdel', reverseKey, ${jthEntityId})
        else
          redis.call('hset', reverseKey, ${jthEntityId}, queryKey)
          redis.call('srem', queryKey, '${VOID_RESULT_STRING}')
          redis.call('sadd', queryKey, ${jthEntityId})
        end
      end
    end
  end
end
for j=1, entitiesCount do
  ${updateStatement}
end`;
  }

  /**
   * Generates a lua script to update an entity in the cache server.
   * This script also updates al the queries related to the entity.
   *
   * @param options Cache options.
   * @returns script generated.
   */
  private _luaSyncUpdateGenerator(options: IPersistencyUpdateOptions): string {
    const queriesNumber: string = '#KEYS / 2';

    const entityId = 'ARGV[1]';
    const entity = 'ARGV[2]';
    const ttl = 'ARGV[3]';
    const ithQCode: string = options.ttl ? 'ARGV[3 + i]' : 'ARGV[2 + i]';

    const entityKey: string = this._luaKeyGeneratorFromId(entityId);
    const reverseHashKey = 'KEYS[2 * i - 1]';
    const queryKey = 'KEYS[2 * i]';

    const updateStatement = this._luaGetUpdateStatement(options, entityKey, entity, ttl);

    return `for i=1, ${queriesNumber} do
  local qCode = ${ithQCode}
  if '${SINGLE_RESULT_QUERY_CODE}' == qCode then
    local reverseKey = ${reverseHashKey};
    local queryKey = ${queryKey}
    local key = redis.call('hget', reverseKey, ${entityId})
    if key then
      redis.call('set', key, '${VOID_RESULT_STRING}')
    end
    redis.call('hset', reverseKey, ${entityId}, queryKey);
    redis.call('set', queryKey, ${entityId})
  else
    if '${MULTIPLE_RESULT_QUERY_CODE}' == qCode then
      local reverseKey = ${reverseHashKey};
      local queryKey = ${queryKey}
      local key = redis.call('hget', reverseKey, ${entityId})
      if key then
        redis.call('srem', key, ${entityId})
        if 0 == redis.call('scard', key) then
          redis.call('sadd', key, '${VOID_RESULT_STRING}')
        end
      end
      if 0 == redis.call('scard', queryKey) then
        redis.call('hdel', reverseKey, ${entityId})
      else
        redis.call('hset', reverseKey, ${entityId}, queryKey)
        redis.call('srem', queryKey, '${VOID_RESULT_STRING}')
        redis.call('sadd', queryKey, ${entityId})
      end
    end
  end
end
${updateStatement}`;
  }
}
