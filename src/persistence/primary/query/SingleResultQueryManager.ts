import { IEntity } from '../../../model/IEntity';
import { ICacheOptions } from '../ICacheOptions';
import { PrimaryQueryManager } from '../PrimaryQueryManager';

const VOID_RESULT_STRING = 'v\x06\x15';

export abstract class SingleResultQueryManager<
  TEntity extends IEntity
> extends PrimaryQueryManager<
  TEntity,
  number | string,
  Promise<TEntity>
> {
  /**
   * Gets the result of a query.
   * @param params Query parameters.
   * @param searchOptions Search options.
   */
  public async get(
    params: any,
    searchOptions?: ICacheOptions,
  ): Promise<TEntity> {
    const key = this._key(params);
    const luaScript = this._luaGetGenerator();
    const resultJson = await this._redis.eval(luaScript, 1, key);
    if (null == resultJson) {
      const id = await this._getIdAndSetToQuery(key, params);
      if (null == id) {
        return null;
      } else {
        return await this._primaryEntityManager.getById(id, searchOptions);
      }
    } else {
      let result: TEntity | Promise<TEntity>;
      this._parseGetResult(
        key,
        resultJson,
        (entity) => { result = entity; },
        (id: number| string) => { result = this._primaryEntityManager.getById(id, searchOptions); },
        () => { result = null; },
      );
      return result;
    }
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
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
    const keys = paramsArray.map((params) => this._key(params));
    const luaScript = this._luaMGetGenerator();
    const resultsJson = await this._redis.eval(luaScript, keys.length, keys);
    const missingIds = new Array<number|string>();
    const finalResults = new Array();
    const missingQueriesKeys = new Array<string>();
    const missingParamsArray = new Array();
    for (let i = 0; i < resultsJson.length; ++i) {
      const resultJson = resultsJson[i];
      if (null == resultJson) {
        missingQueriesKeys.push(keys[i]);
        missingParamsArray.push(paramsArray[i]);
        continue;
      }
      this._parseGetResult(
        keys[i],
        resultJson,
        (entity) => { finalResults.push(entity); },
        (id: number|string) => { missingIds.push(id); },
        // tslint:disable-next-line:no-empty
        () => { },
      );
    }
    const idsFromMissingQueries = await this._mGetIdsAndSetToQueries(missingQueriesKeys, missingParamsArray);
    missingIds.push(...idsFromMissingQueries);
    await this._mGetSearchMissingIds(finalResults, missingIds, searchOptions);
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
      VOID_RESULT_STRING,
    ]);
  }

  /**
   * Syncs the update of multiple entities in cache.
   * @param entities updated entities.
   * @returns Promise of query sync.
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
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   * @returns Promise of query sync
   */
  public syncUpdate(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaUpdateGenerator(),
      2,
      this._reverseHashKey,
      this._key(entity),
      JSON.stringify(entity[this.model.id]),
    );
  }

  /**
   * Gets an id for the query and sets it as the result of the query in the cache server.
   * @param key Key of the query.
   * @param params Query params.
   * @returns Id found or null
   */
  private async _getIdAndSetToQuery(key: string, params: any): Promise<number|string> {
    const id = await this._query(params);
    if (null == id) {
      this._redis.set(key, VOID_RESULT_STRING);
    } else {
      this._redis.eval(
        this._luaSetGenerator(),
        2,
        key,
        this._reverseHashKey,
        JSON.stringify(id),
      );
    }
    return id;
  }

  /**
   * Gets the lua script for a delete request.
   * @returns lua script.
   */
  private _luaDeleteGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], ARGV[1])
if key then
  redis.call('set', key, ARGV[2])
  redis.call('hdel', KEYS[1], ARGV[1])
end`;
  }

  /**
   * Gets the lua script for a get request.
   * @returns lua script.
   */
  private _luaGetGenerator(): string {
    const keyAlias = 'key';
    return `local ${keyAlias} = redis.call('get', KEYS[1])
if ${keyAlias} then
  if ${keyAlias} == '${VOID_RESULT_STRING}' then
    return ${keyAlias}
  else
    local entity = redis.call('get', ${this._luaKeyGeneratorFromId(keyAlias)})
    if entity then
      return entity
    else
      return ${keyAlias}
    end
  end
else
  return nil
end`;
  }

  /**
   * Gets the lua script for a multiple delete request.
   * @returns lua script.
   */
  private _luaMDeleteGenerator(): string {
    return `local reverseKey = KEYS[1]
local voidValue = ARGV[#ARGV]
for i=1, #ARGV-1 do
  local key = redis.call('hget', reverseKey, ARGV[i])
  if key then
    redis.call('set', key, voidValue)
  end
end`;
  }

  /**
   * Gets the lua script for a multiple get request.
   * @returns lua script.
   */
  private _luaMGetGenerator(): string {
    const keyAlias = 'key';
    return `local results = {}
for i=1, #KEYS do
  local ${keyAlias} = redis.call('get', KEYS[i])
  if ${keyAlias} then
    if ${keyAlias} == '${VOID_RESULT_STRING}' then
      results[i] = '${VOID_RESULT_STRING}'
    else
      local entity = redis.call('get', ${this._luaKeyGeneratorFromId(keyAlias)})
      if entity then
        results[i] = entity
      else
        results[i] = key
      end
    end
  else
    results[i] = ${keyAlias}
  end
end
return results`;
  }

  /**
   * Gets the lua script for a multiple query set request.
   * @returns lua script.
   */
  private _luaMSetGenerator(): string {
    return `local reverseKey = KEYS[#KEYS]
for i=1, #KEYS-1 do
  redis.call('set', KEYS[i], ARGV[i])
  if ARGV[i] ~= '${VOID_RESULT_STRING}' then
    redis.call('hset', reverseKey, ARGV[i], KEYS[i])
  end
end`;
  }

  /**
   * Gets the lua script for a multiple update request.
   * @returns lua script.
   */
  private _luaMUpdateGenerator(): string {
    return `local reverseKey = KEYS[#KEYS]
for i=1, #KEYS-1 do
  local key = redis.call('hget', reverseKey, ARGV[i])
  if key then
    redis.call('del', key)
  end
  redis.call('hset', reverseKey, ARGV[i], KEYS[i]);
  redis.call('set', KEYS[i], ARGV[i])
end`;
  }

  /**
   * Gets the lua script for a query set request.
   * @returns lua script.
   */
  private _luaSetGenerator(): string {
    return `redis.call('set', KEYS[1], ARGV[1])
redis.call('hset', KEYS[2], ARGV[1], KEYS[1])`;
  }

  /**
   * Gets the lua script for an update request.
   * @returns lua script.
   */
  private _luaUpdateGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], ARGV[1])
if key then
  redis.call('del', key)
end
redis.call('hset', KEYS[1], ARGV[1], KEYS[2]);
redis.call('set', KEYS[2], ARGV[1])`;
  }

  /**
   * Gets ids from an mQuery and sets it to the cache server.
   * @param keys queries cache keys to set.
   * @param paramsArray Queries params.
   */
  private async _mGetIdsAndSetToQueries(
    keys: string[],
    paramsArray: any[],
  ): Promise<Array<number|string>> {
    if (0 === keys.length) {
      return new Array();
    }
    const originalIds = await this._mquery(paramsArray);
    const ids = originalIds.map(
      (id) =>
        null == id ? VOID_RESULT_STRING : JSON.stringify(id),
    );
    this._redis.eval([
      this._luaMSetGenerator(),
      keys.length + 1,
      ...keys,
      this._reverseHashKey,
      ...ids,
    ]);
    return originalIds.filter((id) => null != id);
  }

  /**
   * Search for missing ids and adds the results to the final results collection.
   * @param finalResults Final results.
   * @param missingIds Missing ids.
   * @param searchOptions Cache options.
   * @returns Promise of results added.
   */
  private async _mGetSearchMissingIds(
    finalResults: TEntity[],
    missingIds: Array<number|string>,
    searchOptions?: ICacheOptions,
  ): Promise<void> {
    if (0 < missingIds.length) {
      const missingEntities = await this._primaryEntityManager.getByIds(missingIds, searchOptions);
      for (const missingEntity of missingEntities) {
        finalResults.push(missingEntity);
      }
    }
  }

  /**
   * Parses the result of an entity get request to the cache server.
   * @param key key obtained.
   * @param resultJson Result obtained from the key.
   * @param entityAction Action to perform if the result is an entity.
   * @param idAction Action to perform if the result is an id.
   * @param voidAction Action to perform if there is a void result.
   */
  private _parseGetResult(
    key: string,
    resultJson: string,
    entityAction: (entity: TEntity) => void,
    idAction: (id: number|string) => void,
    voidAction: () => void,
  ) {
    if (VOID_RESULT_STRING === resultJson) {
      voidAction();
      return;
    }
    const result = JSON.parse(resultJson);
    const resultType = typeof result;
    if ('object' === resultType) {
      entityAction(result);
      return;
    }
    if ('number' === resultType || 'string' === resultType) {
      idAction(result);
      return;
    }
    throw new Error(`Query "${key}" corrupted!`);
  }
}