import { IEntity } from '../../../model/IEntity';
import { ICacheOptions } from '../ICacheOptions';
import { PrimaryQueryManager } from '../PrimaryQueryManager';

const SEPARATOR_STRING = 's\x06\x15';
const VOID_RESULT_STRING = 'v\x06\x15';

export abstract class MultipleResultQueryManager<
  TEntity extends IEntity
> extends PrimaryQueryManager<
  TEntity,
  number[] | string[],
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
      return this._getProcessQueryNotFound(key, params, searchOptions);
    } else {
      if (VOID_RESULT_STRING === resultsJSON) {
        return new Array();
      }
      const missingIds: number[]|string[] = new Array();
      const finalResults = new Array();
      for (const resultJson of resultsJSON) {
        this._getProcessParseableResult(
          key,
          finalResults,
          missingIds,
          resultJson,
        );
      }
      await this._getProcessMissingOptions(missingIds, finalResults, searchOptions);
      return finalResults;
    }
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries params.
   * @param searchOptions Search options.
   * @returns Queries results.
   */
  public async mGet(
    paramsArray: any[],
    searchOptions?: ICacheOptions,
  ): Promise<TEntity[]> {
    if (null == paramsArray || 0 === paramsArray.length) {
      return new Array();
    }
    const keys = paramsArray.map((params: any) => this._key(params));
    const luaScript = this._luaMGetGenerator();
    const resultsJson = await this._redis.eval(luaScript, keys.length, ...keys);

    const finalResults = new Array<TEntity>();
    const missingQueriesParams = new Array();
    const missingQueriesKeys = new Array<string>();
    let currentIndex = 0;
    let resultsFound = false;
    let voidFound = false;
    const missingIds: number[]|string[] = new Array();
    for (const resultJson of resultsJson) {
      if (VOID_RESULT_STRING === resultJson) {
        voidFound = true;
        continue;
      }
      if (SEPARATOR_STRING === resultJson) {
        if (!resultsFound && !voidFound) {
          missingQueriesParams.push(paramsArray[currentIndex]);
          missingQueriesKeys.push(keys[currentIndex]);
        }
        ++currentIndex;
        resultsFound = false;
        voidFound = false;
        continue;
      }
      resultsFound = true;
      this._getProcessParseableResult(
        keys[currentIndex],
        finalResults,
        missingIds,
        resultJson,
      );
    }

    if (0 < missingQueriesKeys.length) {
      const queriesMissingIds = await this._mGetProcessQueriesNotFound(
        missingQueriesParams,
        missingQueriesKeys,
      );
      missingIds.push(...(queriesMissingIds as Array<number & string>));
    }

    await this._getProcessMissingOptions(missingIds, finalResults, searchOptions);

    return finalResults;
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
   * Process the missing ids and adds missing entities to the final results collection.
   * @param missingIds Missing ids collection.
   * @param finalResults Final results collection.
   * @param searchOptions Search options.
   * @param Promise of missing options processed.
   */
  private async _getProcessMissingOptions(
    missingIds: number[]|string[],
    finalResults: TEntity[],
    searchOptions: ICacheOptions,
  ): Promise<void> {
    if (0 < missingIds.length) {
      const missingEntities = await this._primaryEntityManager.getByIds(missingIds, searchOptions);
      for (const missingEntity of missingEntities) {
        finalResults.push(missingEntity);
      }
    }
  }

  /**
   * Process a parseable result.
   * @param key Key used to obtain the result.
   * @param finalResults Final results collection.
   * @param missingIds Missing ids array.
   * @param resultJson Parseable result.
   * @returns Promise results parsed.
   */
  private _getProcessParseableResult(
    key: string,
    finalResults: TEntity[],
    missingIds: Array<number|string>,
    resultJson: string,
  ): void {
    const result = JSON.parse(resultJson);
    const resultType = typeof result;
    if ('object' === resultType) {
      finalResults.push(result);
      return;
    }
    if ('number' === resultType || 'string' === resultType) {
      missingIds.push(result);
      return;
    }
    throw new Error(`Query "${key}" corrupted!`);
  }

  /**
   * Process a query not found obtaining the results and caching them.
   * @param key key of the query.
   * @param params Query params.
   * @param searchOptions Search options.
   * @returns Promise of query results.
   */
  private async _getProcessQueryNotFound(
    key: string,
    params: any,
    searchOptions: ICacheOptions,
  ): Promise<TEntity[]> {
    const ids = await this._query(params);
    const idsJSON = (ids as any[]).map((id) => JSON.stringify(id));
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
for i=1, #ARGV do
  local key = redis.call('hget', reverseKey, ARGV[i])
  if key then
    redis.call('srem', key, ARGV[i])
    if 0 == redis.call('scard', key) then
      redis.call('sadd', key, '${VOID_RESULT_STRING}')
    end
    redis.call('hdel', reverseKey, ARGV[i])
  end
end`;
  }

  /**
   * Gets the lua script for a multiple get request.
   * @returns Lua script.
   */
  private _luaMGetGenerator(): string {
    const entitiesAlias = 'entities';
    const idsAlias = 'ids';
    return `local results = {}
for i=1, #KEYS do
  local ${idsAlias} = redis.call('smembers', KEYS[i])
  if #${idsAlias} > 0 then
    if ${idsAlias}[1] == '${VOID_RESULT_STRING}' then
      results[#results + 1] = '${VOID_RESULT_STRING}'
    else
      local ${entitiesAlias} = {}
      for i = 1, #${idsAlias} do
        ${entitiesAlias}[i] = redis.call('get', ${this._luaKeyGeneratorFromId(idsAlias + '[i]')})
      end
      for i = 1, #${idsAlias} do
        if ${entitiesAlias}[i] then
          results[#results + 1] = ${entitiesAlias}[i]
        else
          results[#results + 1] = ${idsAlias}[i]
        end
      end
    end
  end
  results[#results + 1] = '${SEPARATOR_STRING}'
end
return results`;
  }

  /**
   * Gets the script for a multiple lua set request.
   * @returns Lua script.
   */
  private _luaMSetQueryGenerator(): string {
    /*
     * Lua 5.1 has no "continue" statement...
     * Its important to notice that the last ARGV must not be a SEPARATOR_STRING
     */
    return `local reverseKey = KEYS[#KEYS]
local currentKeyCounter = 1
local currentKey = KEYS[currentKeyCounter]
if redis.call('sismember', currentKey, '${VOID_RESULT_STRING}') then
  redis.call('srem', currentKey, '${VOID_RESULT_STRING}')
end
for i=1, #ARGV do
  if ARGV[i] == '${SEPARATOR_STRING}' then
    currentKeyCounter = currentKeyCounter + 1;
    local currentKey = KEYS[currentKeyCounter]
    if redis.call('sismember', currentKey, '${VOID_RESULT_STRING}') then
      redis.call('srem', currentKey, '${VOID_RESULT_STRING}')
    end
  else
    if ARGV[i] == '${VOID_RESULT_STRING}' then
      if 0 == redis.call('scard', currentKey) then
        redis.call('sadd', currentKey, '${VOID_RESULT_STRING}')
      end
    else
      redis.call('hset', reverseKey, ARGV[i], currentKey)
      redis.call('sadd', currentKey, ARGV[i])
    end
  end
end`;
  }

  /**
   * Gets the lua script for an mUpdate request.
   * @returns Lua script.
   */
  private _luaMUpdateGenerator(): string {
    return `local reverseKey = KEYS[#KEYS]
for i=1, #KEYS-1 do
  local key = redis.call('hget', reverseKey, ARGV[i])
  if key then
    redis.call('srem', key, ARGV[i])
    if 0 == redis.call('scard', key) then
      redis.call('sadd', key, '${VOID_RESULT_STRING}')
    end
  end
  redis.call('hset', reverseKey, ARGV[i], KEYS[i])
  if redis.call('sismember', KEYS[i], '${VOID_RESULT_STRING}') then
    redis.call('srem', KEYS[i], '${VOID_RESULT_STRING}')
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

  /**
   * Process multiple not found queries.
   * @param paramsArray queries params.
   * @param keys Queries cache keys.
   * @returns Promise of queries processed.
   */
  private async _mGetProcessQueriesNotFound(
    paramsArray: any[],
    keys: string[],
  ): Promise<number[] | string[]> {
    const ids = await this._mquery(paramsArray);
    const evalParams = [
      this._luaMSetQueryGenerator(),
      keys.length + 1,
      ...keys,
      this._reverseHashKey,
    ];
    const finalIds: number[] | string[] = new Array();
    for (let i = 0; i < ids.length - 1; ++i) {
      this._mGetProcessQueriesNotFoundProcessIds(evalParams, ids[i] as Array<number&string>, finalIds);
      evalParams.push(SEPARATOR_STRING);
    }
    this._mGetProcessQueriesNotFoundProcessIds(evalParams, ids[ids.length - 1] as Array<number&string>, finalIds);

    this._redis.eval(evalParams);
    return finalIds;
  }

  private _mGetProcessQueriesNotFoundProcessIds(
    evalParams: Array<string|number>,
    currentIds: Array<string&number>,
    finalIds: number[] | string[],
  ) {
    if (0 === currentIds.length) {
      evalParams.push(VOID_RESULT_STRING);
    } else {
      finalIds.push(...currentIds);
      const mappedIds = (currentIds as any[]).map((id) => JSON.stringify(id));
      evalParams.push(...mappedIds);
    }
  }
}
