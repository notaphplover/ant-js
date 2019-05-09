import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from './IModelManager';
import { IPrimaryEntityManager } from './IPrimaryEntityManager';
import {
  MULTIPLE_RESULT_QUERY_CODE,
  SINGLE_RESULT_QUERY_CODE,
  VOID_RESULT_STRING,
} from './LuaConstants';
import { ICacheOptions } from './options/ICacheOptions';
import { IPrimaryQueryManager } from './query/IPrimaryQueryManager';

export class ModelManager<TEntity extends IEntity> implements IModelManager<TEntity> {
  /**
   * Model managed.
   */
  protected _model: IModel;
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
   * @param model Model managed.
   * @param redis Redis connection.
   * @param primaryEntityManager Primary entity manager.
   * @param queryManagers Query managers.
   */
  public constructor(
    model: IModel,
    redis: IORedis.Redis,
    primaryEntityManager: IPrimaryEntityManager<TEntity>,
    queryManagers: Array<IPrimaryQueryManager<TEntity>> = new Array(),
  ) {
    this._model = model;
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
    const evalParams = [
      this._luaSyncDeleteGenerator(),
      this._queryManagers.length,
    ];
    for (const queryManager of this._queryManagers) {
      evalParams.push(queryManager.reverseHashKey);
    }
    evalParams.push(JSON.stringify(id));
    for (const queryManager of this._queryManagers) {
      evalParams.push(queryManager.isMultiple ? MULTIPLE_RESULT_QUERY_CODE : SINGLE_RESULT_QUERY_CODE);
    }
    return this._redis.eval(evalParams);
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
    if (null == ids || 0 === ids.length) {
      return new Promise((resolve) => resolve());
    }
    const evalParams = [
      this._luaSyncMDeleteGenerator(),
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
    return this._redis.eval(evalParams);
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
   * @returns Promise of entities updated.
   */
  public mUpdate(entities: TEntity[]): Promise<any> {
    if (null == entities || 0 === entities.length) {
      return new Promise((resolve) => resolve());
    }
    const evalParams = [
      this._luaSyncMUpdateGenerator(),
      this._queryManagers.length * (entities.length + 1),
    ];
    for (const queryManager of this._queryManagers) {
      evalParams.push(queryManager.reverseHashKey);
      for (const entity of entities) {
        evalParams.push(queryManager.keyGen(entity));
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

    return this._redis.eval(evalParams);
  }

  /**
   * Updates an entity at the cache layer.
   * @param entity Entity to be updated.
   */
  public update(entity: TEntity): Promise<any> {
    const evalParams = [
      this._luaSyncUpdateGenerator(),
      2 * this._queryManagers.length,
    ];
    for (const queryManager of this._queryManagers) {
      evalParams.push(queryManager.reverseHashKey);
      evalParams.push(queryManager.keyGen(entity));
    }
    evalParams.push(JSON.stringify(entity[this._model.id]));
    evalParams.push(JSON.stringify(entity));
    for (const queryManager of this._queryManagers) {
      evalParams.push(queryManager.isMultiple ? MULTIPLE_RESULT_QUERY_CODE : SINGLE_RESULT_QUERY_CODE);
    }
    return this._redis.eval(evalParams);
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
    const entityKey: string = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator()(entityId);
    const queriesNumber: string = '#KEYS';
    const ithQCode: string = 'ARGV[1 + i]';

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
redis.call('del', ${entityKey})`;
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
    const jthEntityKey: string = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator()(jthEntityId);
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
  redis.call('del', ${jthEntityKey})
end`;
  }

  /**
   * Generates a lua script to update multiple entities in the cache server.
   * This script also updates al the queries related to the entities.
   *
   * @returns script generated.
   */
  private _luaSyncMUpdateGenerator(): string {
    const queriesNumber: string = 'ARGV[#ARGV]';
    const entitiesCount = '(#ARGV - queriesNumber - 1) / 2';
    const ithQCode = 'ARGV[2 * entitiesCount + i]';
    const ithReverseKeyIndex = '(entitiesCount + 1) * (i - 1) + 1';
    const ithReverseKey = 'KEYS[ithReverseKeyIndex]';
    const jthEntity = 'ARGV[entitiesCount + j]';
    const jthEntityId = 'ARGV[j]';
    const jthEntityKey: string = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator()(jthEntityId);
    const jthQueryKeyIndex = 'ithReverseKeyIndex + j';
    const jthQueryKey = 'KEYS[jthQueryKeyIndex]';
    return `local queriesNumber = ARGV[#ARGV]
local entitiesCount = ${entitiesCount}
for i=1, ${queriesNumber} do
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
  redis.call('set', ${jthEntityKey}, ${jthEntity})
end`;
  }

  /**
   * Generates a lua script to update an entity in the cache server.
   * This script also updates al the queries related to the entity.
   *
   * @returns script generated.
   */
  private _luaSyncUpdateGenerator(): string {
    const queriesNumber: string = '#KEYS / 2';

    const entityId = 'ARGV[1]';
    const entity = 'ARGV[2]';
    const entityKey: string = this._primaryEntityManager.getKeyGenerationLuaScriptGenerator()(entityId);
    const reverseHashKey = 'KEYS[2 * i - 1]';
    const queryKey = 'KEYS[2 * i]';

    const ithQCode: string = 'ARGV[2 + i]';

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
redis.call('set', ${entityKey}, ${entity})`;
  }
}
