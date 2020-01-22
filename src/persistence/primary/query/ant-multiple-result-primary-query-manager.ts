import * as _ from 'lodash';
import { SEPARATOR_STRING, VOID_RESULT_STRING } from '../lua-constants';
import { AntPrimaryQueryManager } from './ant-primary-query-manager';
import { Entity } from '../../../model/entity';
import { MultipleResultPrimaryQueryManager } from './multiple-result-primary-query-manager';
import { PersistencySearchOptions } from '../options/persistency-search-options';

export class AntMultipleResultPrimaryQueryManager<TEntity extends Entity>
  extends AntPrimaryQueryManager<TEntity, number[] | string[]>
  implements MultipleResultPrimaryQueryManager<TEntity> {
  /**
   * True if the queries managed can return multiple results.
   */
  public get isMultiple(): boolean {
    return true;
  }

  /**
   * Gets the result of a query.
   * @param params Query parameters.
   * @param options Cache options.
   * @returns Entities found.
   */
  public async get(params: any, options: PersistencySearchOptions): Promise<TEntity[]> {
    if (options.ignorePrimaryLayer) {
      return this._getQueryIgnoringPrimaryLayer(params, options);
    }
    if (options.ignoreSecondaryLayer) {
      throw new Error('this configuration is not currently supported');
    }
    const key = this.queryKeyGen(params);
    const luaScript = this._luaGetGenerator();
    const resultsJSON = await this._redis.eval(luaScript, 1, key);

    if (null == resultsJSON) {
      return this._getProcessQueryNotFound(key, params, options);
    } else {
      if (VOID_RESULT_STRING === resultsJSON) {
        return new Array();
      }
      const missingIds: number[] | string[] = new Array();
      let finalResults = new Array();
      for (const resultJson of resultsJSON) {
        this._getProcessParseableResult(key, finalResults, missingIds, resultJson);
      }
      finalResults = this._model.mPrimaryToEntity(finalResults);
      await this._getProcessMissingOptions(missingIds, finalResults, options);
      return finalResults;
    }
  }

  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries params.
   * @param options Cache options.
   * @returns Queries results.
   */
  public async mGet(paramsArray: any[], options: PersistencySearchOptions): Promise<TEntity[]> {
    if (null == paramsArray || 0 === paramsArray.length) {
      return new Array();
    }
    if (options.ignorePrimaryLayer) {
      return this._getMQueryIgnoringPrimaryLayer(paramsArray, options);
    }
    if (options.ignoreSecondaryLayer) {
      throw new Error('this configuration is not currently supported');
    }
    const keys = _.map(paramsArray, this.queryKeyGen.bind(this));
    const luaScript = this._luaMGetGenerator();
    const resultsJson: string[] = await this._redis.eval(luaScript, keys.length, ...keys);

    let finalResults = new Array<TEntity>();
    const missingQueriesParams = new Array();
    const missingQueriesKeys = new Array<string>();
    const missingIds: number[] | string[] = new Array();

    this._mGetProcessParseableResults(
      resultsJson,
      (index) => {
        missingQueriesParams.push(paramsArray[index]);
        missingQueriesKeys.push(keys[index]);
      },
      (index, resultJson) => {
        this._getProcessParseableResult(keys[index], finalResults, missingIds, resultJson);
      },
    );

    finalResults = this._model.mPrimaryToEntity(finalResults);

    if (0 < missingQueriesKeys.length) {
      const queriesMissingIds = await this._mGetProcessQueriesNotFound(missingQueriesParams, missingQueriesKeys);
      missingIds.push(...(queriesMissingIds as Array<number & string>));
    }

    await this._getProcessMissingOptions(missingIds, finalResults, options);

    return finalResults;
  }

  /**
   * Gets a query result ignoring the primary layer.
   * @param params Query parameters.
   * @param options Query options.
   * @returns Query result
   */
  protected _getQueryIgnoringPrimaryLayer(params: any, options: PersistencySearchOptions): Promise<TEntity[]> {
    return this._query(params).then((ids) => this._manager.mGet(ids, options));
  }

  /**
   * Process the missing ids and adds missing entities to the final results collection.
   * @param missingIds Missing ids collection.
   * @param finalResults Final results collection.
   * @param options Cache options.
   * @param Promise of missing options processed.
   */
  private async _getProcessMissingOptions(
    missingIds: number[] | string[],
    finalResults: TEntity[],
    options: PersistencySearchOptions,
  ): Promise<void> {
    if (0 < missingIds.length) {
      const missingEntities = await this._manager.mGet(missingIds, options);
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
    missingIds: Array<number | string>,
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
   * @param options Cache options.
   * @returns Promise of query results.
   */
  private async _getProcessQueryNotFound(
    key: string,
    params: any,
    options: PersistencySearchOptions,
  ): Promise<TEntity[]> {
    const ids = await this._query(params);
    if (null != ids && ids.length > 0) {
      this._redis.eval(this._getProcessQueryNotFoundBuildMSetParams(ids, key));
      return this._manager.mGet(ids, options);
    } else {
      this._redis.eval(this._luaSetVoidQueryGenerator(), 1, key);
      return new Array();
    }
  }

  /**
   * Creates a param array to assign ids to a cached query entry.
   * @param ids Entity ids.
   * @param key Query key.
   * @returns Param array generated.
   */
  private _getProcessQueryNotFoundBuildMSetParams(ids: number[] | string[], key: string): Array<number | string> {
    const evalParams = new Array(ids.length + 4);
    evalParams[0] = this._luaSetQueryGenerator();
    evalParams[1] = 2;
    evalParams[2] = key;
    evalParams[3] = this._reverseHashKey;
    for (let i = 0; i < ids.length; ++i) {
      evalParams[i + 4] = JSON.stringify(ids[i]);
    }
    return evalParams;
  }

  /**
   * Gets the lua script for a get request.
   * @returns lua script.
   */
  private _luaGetGenerator(): string {
    const entityId = 'KEYS[1]';
    const entitiesAlias = 'entities';
    const idsAlias = 'ids';
    const resultAlias = 'result';
    return `local ${idsAlias} = redis.call('smembers', ${entityId})
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
   * Gets the lua script for a multiple get request.
   * @returns Lua script.
   */
  private _luaMGetGenerator(): string {
    const ithQueryKey = 'KEYS[i]';
    const entitiesAlias = 'entities';
    const idsAlias = 'ids';
    return `local results = {}
for i=1, #KEYS do
  local ${idsAlias} = redis.call('smembers', ${ithQueryKey})
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
redis.call('srem', currentKey, '${VOID_RESULT_STRING}')
for i=1, #ARGV do
  if ARGV[i] == '${SEPARATOR_STRING}' then
    currentKeyCounter = currentKeyCounter + 1;
    currentKey = KEYS[currentKeyCounter]
    redis.call('srem', currentKey, '${VOID_RESULT_STRING}')
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
   * Gets the lua script for a query set request.
   * @returns Lua script
   */
  private _luaSetQueryGenerator(): string {
    return `redis.call('srem', KEYS[1], '${VOID_RESULT_STRING}')
for i=1, #ARGV do
  redis.call('sadd', KEYS[1], ARGV[i])
  redis.call('hset', KEYS[2], ARGV[i], KEYS[1])
end`;
  }
  /**
   * Gets the lua script to set a query with no results.
   * @returns Lua script
   */
  private _luaSetVoidQueryGenerator(): string {
    return `if 0 == redis.call('scard', KEYS[1]) then
  redis.call('sadd', KEYS[1], '${VOID_RESULT_STRING}')
end`;
  }

  /**
   * Process reults obtained from an mQuery request to the cache server.
   * @param resultsJson Results obtained from redis.
   * @param onQueryMiss Action to perform if a missing query is found.
   * @param onQueryHit Action to perform if query results are found.
   */
  private _mGetProcessParseableResults(
    resultsJson: string[],
    onQueryMiss: (index: number) => void,
    onQueryHit: (index: number, result: any) => void,
  ): void {
    let currentIndex = 0;
    let resultsFound = false;
    let voidFound = false;

    for (const resultJson of resultsJson) {
      if (VOID_RESULT_STRING === resultJson) {
        voidFound = true;
        continue;
      }
      if (SEPARATOR_STRING === resultJson) {
        if (!resultsFound && !voidFound) {
          onQueryMiss(currentIndex);
        }
        ++currentIndex;
        resultsFound = false;
        voidFound = false;
        continue;
      }
      resultsFound = true;
      onQueryHit(currentIndex, resultJson);
    }
  }

  /**
   * Process multiple not found queries.
   * @param paramsArray queries params.
   * @param keys Queries cache keys.
   * @returns Promise of queries processed.
   */
  private async _mGetProcessQueriesNotFound(paramsArray: any[], keys: string[]): Promise<number[] | string[]> {
    const ids = await this._mquery(paramsArray);
    const evalParams = [this._luaMSetQueryGenerator(), keys.length + 1, ...keys, this._reverseHashKey];
    const finalIds: number[] | string[] = new Array();
    for (let i = 0; i < ids.length - 1; ++i) {
      this._mGetProcessQueriesNotFoundProcessIds(evalParams, ids[i] as Array<number & string>, finalIds);
      evalParams.push(SEPARATOR_STRING);
    }
    this._mGetProcessQueriesNotFoundProcessIds(evalParams, ids[ids.length - 1] as Array<number & string>, finalIds);

    this._redis.eval(evalParams);
    return finalIds;
  }

  /**
   * Prepares a set of ids in order to send a redis command.
   * @param evalParams Eval params.
   * @param currentIds Ids of the entities to be found.
   * @param finalIds Stringified ids.
   */
  private _mGetProcessQueriesNotFoundProcessIds(
    evalParams: Array<string | number>,
    currentIds: number[] | string[],
    finalIds: number[] | string[],
  ): void {
    if (0 === currentIds.length) {
      evalParams.push(VOID_RESULT_STRING);
    } else {
      for (const id of currentIds) {
        (finalIds as Array<number | string>).push(id);
        evalParams.push(JSON.stringify(id));
      }
    }
  }
}
