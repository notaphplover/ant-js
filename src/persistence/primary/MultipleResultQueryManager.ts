import { IEntity } from '../../model/IEntity';
import { ICacheOptions } from './ICacheOptions';
import { PrimaryQueryManager } from './PrimaryQueryManager';

const VOID_RESULT_STRING = 'v\x06\x15';

export abstract class MultipleResultQueryManager<
  TEntity extends IEntity
> extends PrimaryQueryManager<
  TEntity,
  (params: any) => Promise<Array<number | string>>,
  Promise<TEntity[]>
> {
  /**
   * Gets the result of a query.
   * @param params Query parameters.
   * @param searchOptions Search options.
   * @returns Entities found.
   */
  public async get(
    params: any,
    searchOptions?: ICacheOptions,
  ): Promise<TEntity[]> {
    const key = this._key(params);
    const luaScript = this._luaGetGenerator();
    const resultsJSON = await this._redis.eval(luaScript, 1, key);

    if (null == resultsJSON) {
      const ids = await this._query(params);
      const idsJSON = ids.map((id) => JSON.stringify(id));
      if (null != ids && ids.length > 0) {
        this._redis.eval([
          this._luaSetQueryGenerator(),
          3,
          key,
          this._reverseHashKey,
          VOID_RESULT_STRING,
          ...idsJSON,
        ]);
        return this._primaryEntityManager.getByIds(ids, searchOptions);
      } else {
        this._redis.eval(
          this._luaSetVoidQueryGenerator(),
          1,
          key,
          VOID_RESULT_STRING,
        );
        return new Array();
      }
    } else {
      if (VOID_RESULT_STRING === resultsJSON) {
        return new Array();
      }
      const missingIds = new Array<number|string>();
      const finalResults = new Array();

      for (const resultJson of resultsJSON) {
        const result = JSON.parse(resultJson);
        const resultType = typeof result;
        if ('object' === resultType) {
          finalResults.push(result);
          continue;
        }
        if ('number' === resultType || 'string' === resultType) {
          missingIds.push(result);
          continue;
        }
        throw new Error(`Query "${key}" corrupted!`);
      }
      if (0 < missingIds.length) {
        const missingEntities = await this._primaryEntityManager.getByIds(missingIds, searchOptions);
        for (const missingEntity of missingEntities) {
          finalResults.push(missingEntity);
        }
      }
      return finalResults;
    }
  }

  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   * @returns Promise of query sync
   */
  public syncDelete(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaDeleteGenerator(),
      1,
      this._reverseHashKey,
      JSON.stringify(entity[this.model.id]),
      VOID_RESULT_STRING,
    );
  }

  /**
   * Syncs the remove of entities in cache.
   * @param entities deleted entities.
   * @returns Promise of query sync
   */
  public syncMDelete(entities: TEntity[]): Promise<void> {
    if (null == entities || 0 === entities.length) {
      return new Promise((resolve) => { resolve(); });
    }
    return this._redis.eval([
      this._luaMDeleteGenerator(),
      1,
      this._reverseHashKey,
      ...(entities.map((entity) => JSON.stringify(entity[this.model.id]))),
      VOID_RESULT_STRING,
    ]);
  }

  /**
   * Syncs the update of multiple entities.
   * @param entities updated entities.
   * @returns Promise of query sync
   */
  public syncMUpdate(entities: TEntity[]): Promise<void> {
    if (null == entities || 0 === entities.length) {
      return new Promise((resolve) => { resolve(); });
    }
    return this._redis.eval([
      this._luaMUpdateGenerator(),
      entities.length + 1,
      ...(entities.map((entity) => this._key(entity))),
      this._reverseHashKey,
      ...(entities.map((entity) => JSON.stringify(entity[this.model.id]))),
      VOID_RESULT_STRING,
    ]);
  }

  /**
   * Updates an entity in queries related to the entity.
   * @param entity entity to be updated.
   * @returns Promise of query sync.
   */
  public syncUpdate(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaUpdateGenerator(),
      2,
      this._reverseHashKey,
      this._key(entity),
      VOID_RESULT_STRING,
      JSON.stringify(entity[this.model.id]),
    );
  }

  /**
   * Gets the lua script for a delete request.
   * @returns lua script.
   */
  private _luaDeleteGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], ARGV[1])
if key then
  redis.call('srem', key, ARGV[1])
  if 0 == redis.call('scard', key) then
    redis.call('sadd', key, ARGV[2])
  end
  redis.call('hdel', KEYS[1], ARGV[1])
end`;
  }

  /**
   * Gets the lua script for a get request.
   * @returns lua script.
   */
  private _luaGetGenerator(): string {
    const entitiesAlias = 'entities';
    const idsAlias = 'ids';
    const resultAlias = 'result';
    return `local ${idsAlias} = redis.call('smembers', KEYS[1])
if #${idsAlias} == 0 then
  return nil
else
  if ${idsAlias}[1] == '${VOID_RESULT_STRING}' then
    return '${VOID_RESULT_STRING}'
  else
    local ${entitiesAlias} = {}
    for i = 1, #${idsAlias} do
      ${entitiesAlias}[i] = redis.call('get', ${this._luaKeyGeneratorFromId(idsAlias + '[i]')})
    end
    local ${resultAlias} = {}
    for i = 1, #${idsAlias} do
      if ${entitiesAlias}[i] then
        ${resultAlias}[i] = ${entitiesAlias}[i]
      else
        ${resultAlias}[i] = ${idsAlias}[i]
      end
    end
    return ${resultAlias}
  end
end`;
  }

  /**
   * Gets the lua script for a multiple delete request.
   * @returns Lua script.
   */
  private _luaMDeleteGenerator(): string {
    return `local reverseKey = KEYS[1]
local voidValue = ARGV[#ARGV]
for i=1, #ARGV-1 do
  local key = redis.call('hget', reverseKey, ARGV[i])
  if key then
    redis.call('srem', key, ARGV[i])
    if 0 == redis.call('scard', key) then
      redis.call('sadd', key, voidValue)
    end
    redis.call('hdel', reverseKey, ARGV[i])
  end
end`;
  }

  /**
   * Gets the lua script for an mUpdate request.
   * @returns Lua script.
   */
  private _luaMUpdateGenerator(): string {
    return `local reverseKey = KEYS[#KEYS]
local voidValue = ARGV[#ARGV]
for i=1, #KEYS-1 do
  local key = redis.call('hget', reverseKey, ARGV[i])
  if key then
    redis.call('srem', key, ARGV[i])
    if 0 == redis.call('scard', key) then
      redis.call('sadd', key, voidValue)
    end
  end
  redis.call('hset', reverseKey, ARGV[i], KEYS[i])
  if redis.call('sismember', KEYS[i], voidValue) then
    redis.call('srem', KEYS[i], voidValue)
  end
  redis.call('sadd', KEYS[i], ARGV[i])
end`;
  }

  /**
   * Gets the lua script for a query set request.
   * @returns Lua script
   */
  private _luaSetQueryGenerator(): string {
    return `if redis.call('sismember', KEYS[1], KEYS[3]) then
  redis.call('srem', KEYS[1], KEYS[3])
end
for i=1, #ARGV do
  redis.call('sadd', KEYS[1], ARGV[i])
end
local msetArgs = {}
for i=1, #ARGV do
  redis.call('hset', KEYS[2], ARGV[i], KEYS[1])
end`;
  }
  /**
   * Gets the lua script to set a query with no results.
   * @returns Lua script
   */
  private _luaSetVoidQueryGenerator(): string {
    return `if (0 == redis.call('scard', KEYS[1])) then
  redis.call('sadd', KEYS[1], ARGV[1])
end`;
  }
  /**
   * Gets the lua script for an update request.
   * @returns lua script.
   */
  private _luaUpdateGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], ARGV[2])
if key then
  redis.call('srem', key, ARGV[2])
  if 0 == redis.call('scard', key) then
    redis.call('sadd', key, ARGV[1])
  end
end
redis.call('hset', KEYS[1], ARGV[2], KEYS[2])
if redis.call('sismember', KEYS[2], ARGV[1]) then
  redis.call('srem', KEYS[2], ARGV[1])
end
redis.call('sadd', KEYS[2], ARGV[2])`;
  }
}
