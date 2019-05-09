import { IEntity } from '../../../model/IEntity';
import { VOID_RESULT_STRING } from '../LuaConstants';
import { ICacheOptions } from '../options/ICacheOptions';
import { PrimaryQueryManager } from './PrimaryQueryManager';

export class SingleResultQueryManager<
  TEntity extends IEntity
> extends PrimaryQueryManager<
  TEntity,
  number | string
> {
  /**
   * True if the queries managed can return multiple results.
   */
  public get isMultiple(): boolean { return false; }

  /**
   * Gets the result of a query.
   * @param params Query parameters.
   * @param cacheOptions Cache options.
   */
  public async get(
    params: any,
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity> {
    const key = this.queryKeyGen(params);
    const luaScript = this._luaGetGenerator();
    const resultJson = await this._redis.eval(luaScript, 1, key);
    if (null == resultJson) {
      const id = await this._getIdAndSetToQuery(key, params);
      if (null == id) {
        return null;
      } else {
        return await this._primaryEntityManager.getById(id, cacheOptions);
      }
    } else {
      let result: TEntity | Promise<TEntity>;
      this._parseGetResult(
        key,
        resultJson,
        (entity) => { result = entity; },
        (id: number| string) => { result = this._primaryEntityManager.getById(id, cacheOptions); },
        () => { result = null; },
      );
      return result;
    }
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param cacheOptions Cache options.
   * @returns Queries results.
   */
  public async mGet(
    paramsArray: any[],
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity[]> {
    if (null == paramsArray || 0 === paramsArray.length) {
      return new Array();
    }
    const keys = paramsArray.map((params) => this.queryKeyGen(params));
    const luaScript = this._luaMGetGenerator();
    const resultsJson = await this._redis.eval(luaScript, keys.length, keys);
    const missingIds: number[]|string[] = new Array();
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
        (id: number&string) => { missingIds.push(id); },
        // tslint:disable-next-line:no-empty
        () => { },
      );
    }
    const idsFromMissingQueries = await this._mGetIdsAndSetToQueries(missingQueriesKeys, missingParamsArray);
    missingIds.push(...(idsFromMissingQueries as Array<number&string>));
    await this._mGetSearchMissingIds(finalResults, missingIds, cacheOptions);
    return finalResults;
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
   * Gets the lua script for a multiple get request.
   * @returns lua script.
   */
  private _luaMGetGenerator(): string {
    const ithQueryKey = 'KEYS[i]';
    const keyAlias = 'key';
    return `local results = {}
for i=1, #KEYS do
  local ${keyAlias} = redis.call('get', ${ithQueryKey})
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
   * Gets the lua script for a query set request.
   * @returns lua script.
   */
  private _luaSetGenerator(): string {
    return `redis.call('set', KEYS[1], ARGV[1])
redis.call('hset', KEYS[2], ARGV[1], KEYS[1])`;
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
   * @param cacheOptions Cache options.
   * @returns Promise of results added.
   */
  private async _mGetSearchMissingIds(
    finalResults: TEntity[],
    missingIds: number[]|string[],
    cacheOptions?: ICacheOptions,
  ): Promise<void> {
    if (0 < missingIds.length) {
      const missingEntities = await this._primaryEntityManager.getByIds(missingIds, cacheOptions);
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
