import { MULTIPLE_RESULT_QUERY_CODE, SINGLE_RESULT_QUERY_CODE, VOID_RESULT_STRING } from './lua-constants';
import { AntPrimaryEntityManager } from './ant-primary-entity-manager';
import { DeleteEntitiesCachedScriptSet } from './script/delete-entities-cached-script-set';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PersistencyUpdateOptions } from '../options/persistency-update-options';
import { PrimaryModelManager } from './primary-model-manager';
import { PrimaryQueryManager } from '../query/primary-query-manager';
import { RedisCachedScript } from './script/redis-cached-script';
import { RedisMiddleware } from './redis-middleware';
import { UpdateEntitiesCachedScriptSet } from './script/update-entities-cached-script-set';

export class AntPrimaryModelManager<TEntity extends Entity> extends AntPrimaryEntityManager<TEntity>
  implements PrimaryModelManager<TEntity> {
  /**
   * Cached script for deleting an entity.
   */
  protected _luaDeleteCachedQuery: DeleteEntitiesCachedScriptSet;
  /**
   * Cached script for deleting multiple entities.
   */
  protected _luaMDeleteCachedQuery: DeleteEntitiesCachedScriptSet;
  /**
   * Cached script set for updating multiple entities.
   */
  protected _luaMUpdateCachedQuerySet: UpdateEntitiesCachedScriptSet;
  /**
   * Cached script set for updating an entity.
   */
  protected _luaUpdateCachedQuerySet: UpdateEntitiesCachedScriptSet;

  /**
   * Query managers.
   */
  protected _queryManagers: Array<PrimaryQueryManager<TEntity>>;

  /**
   * Creates a new model manager.
   * @param model Model managed.
   * @param redis Redis connection.
   * @param negativeEntityCache True to use negative entity cache.
   * @param secondaryEntityManager Secondary entity manager.
   * @param queryManagers Query managers.
   */
  public constructor(model: Model<TEntity>, redis: RedisMiddleware, negativeEntityCache: boolean) {
    super(model, redis, negativeEntityCache);

    this._initializeCachedQueries();

    this._queryManagers = new Array();
  }

  /**
   * Adds a query manager to the model manager.
   * @param queryManager Query manager to add.
   */
  public addQuery(queryManager: PrimaryQueryManager<TEntity>): this {
    this._queryManagers.push(queryManager);
    return this;
  }

  /**
   * Deletes an entity
   * @param id id of the entity to delete.
   * @param options Delete options.
   * @returns Promise of entity deleted.
   */
  public async delete(id: number | string): Promise<any> {
    return this._luaDeleteCachedQuery.eval(this.negativeCache, (scriptArg: string) => {
      const evalParams = [scriptArg, this._queryManagers.length];
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
   * @param options Delete options.
   * @returns Promise of entities deleted.
   */
  public async mDelete(ids: number[] | string[]): Promise<any> {
    if (null == ids || 0 === ids.length) {
      return Promise.resolve();
    }
    return this._luaMDeleteCachedQuery.eval(this.negativeCache, (scriptArg) => {
      const evalParams = [scriptArg, this._queryManagers.length];
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
  public mUpdate(entities: TEntity[], options: PersistencyUpdateOptions): Promise<any> {
    if (null == entities || 0 === entities.length) {
      return Promise.resolve();
    }
    return this._luaMUpdateCachedQuerySet.eval(options, (scriptArg) => {
      const evalParams = [scriptArg, this._queryManagers.length * (entities.length + 1)];
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.reverseHashKey);
        for (const entity of entities) {
          evalParams.push(queryManager.entityKeyGen(entity));
        }
      }
      for (const entity of entities) {
        evalParams.push(entity[this._model.id]);
      }
      entities = this.model.mEntityToPrimary(entities);
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
  public update(entity: TEntity, options: PersistencyUpdateOptions): Promise<any> {
    return this._luaUpdateCachedQuerySet.eval(options, (scriptArg) => {
      const evalParams = [scriptArg, 2 * this._queryManagers.length];
      for (const queryManager of this._queryManagers) {
        evalParams.push(queryManager.reverseHashKey);
        evalParams.push(queryManager.entityKeyGen(entity));
      }
      evalParams.push(JSON.stringify(entity[this._model.id]));
      evalParams.push(JSON.stringify(this.model.entityToPrimary(entity)));
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
    this._luaDeleteCachedQuery = new DeleteEntitiesCachedScriptSet(
      (negativeCache) => new RedisCachedScript(this._luaSyncDeleteGenerator(negativeCache), this._redis),
    );
    this._luaMDeleteCachedQuery = new DeleteEntitiesCachedScriptSet(
      (negativeCache) => new RedisCachedScript(this._luaSyncMDeleteGenerator(negativeCache), this._redis),
    );
    this._luaMUpdateCachedQuerySet = new UpdateEntitiesCachedScriptSet(
      (options) => new RedisCachedScript(this._luaSyncMUpdateGenerator(options), this._redis),
    );
    this._luaUpdateCachedQuerySet = new UpdateEntitiesCachedScriptSet(
      (options) => new RedisCachedScript(this._luaSyncUpdateGenerator(options), this._redis),
    );
  }

  /**
   * Generates a lua script to delete an entity in the cache server.
   * This script also updates al the queries related to the entity.
   *
   * @param options Delete options.
   * @returns script generated.
   */
  private _luaSyncDeleteGenerator(negativeCache: boolean): string {
    const reverseHashKey = 'KEYS[i]';

    const entityId = 'ARGV[1]';
    const entityKey = this._luaKeyGeneratorFromId(entityId);
    const queriesNumber = '#KEYS';
    const ithQCode = 'ARGV[1 + i]';

    const deleteSentence = negativeCache
      ? `redis.call('set', ${entityKey}, '${VOID_RESULT_STRING}')`
      : `redis.call('del', ${entityKey})`;

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
   * @param options Delete options.
   *
   * @returns script generated.
   */
  private _luaSyncMDeleteGenerator(negativeCache: boolean): string {
    const queriesNumber = '#KEYS';
    const entitiesCount = '#ARGV - #KEYS';
    const ithQCode = 'ARGV[entitiesCount + i]';
    const ithReverseKey = 'KEYS[i]';
    const jthEntityId = 'ARGV[j]';
    const jthEntityKey: string = this._luaKeyGeneratorFromId(jthEntityId);

    const deleteSentence = negativeCache
      ? `redis.call('set', ${jthEntityKey}, '${VOID_RESULT_STRING}')`
      : `redis.call('del', ${jthEntityKey})`;

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
  private _luaSyncMUpdateGenerator(options: PersistencyUpdateOptions): string {
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
  private _luaSyncUpdateGenerator(options: PersistencyUpdateOptions): string {
    const queriesNumber = '#KEYS / 2';

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
