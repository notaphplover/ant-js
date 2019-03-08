import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IEntitySearchOptions } from './IEntitySearchOptions';
import { PrimaryQueryManager } from './PrimaryQueryManager';

const VOID_RESULT_STRING = 'v\x06\x15';

export abstract class MultipleResultQueryManager<
  TModel extends IModel,
  TEntity extends IEntity
> extends PrimaryQueryManager<
  TModel,
  TEntity,
  (params: any) => Promise<Array<number | string>>,
  Promise<TEntity[]>
> {
  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   * @returns Promise of query sync
   */
  public deleteEntityInQueries(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaDeleteGenerator(),
      2,
      this._reverseHashKey,
      entity[this._primaryModelManager.model.id],
      JSON.stringify(VOID_RESULT_STRING),
    );
  }

  /**
   * Gets the result of a query.
   * @param params Query parameters.
   * @param searchOptions Search options.
   * @returns Entities found.
   */
  public async get(
    params: any,
    searchOptions?: IEntitySearchOptions,
  ): Promise<TEntity[]> {
    const key = this._key(params);
    const luaScript = this._luaGetGenerator();
    const resultJSON = await this._redis.eval(luaScript, 1, key);

    if (null == resultJSON) {
      const ids = await this._query(params);
      if (null != ids && ids.length > 0) {
        this._redis.eval([
          this._luaSetQueryGenerator(),
          3,
          key,
          this._reverseHashKey,
          VOID_RESULT_STRING,
          ...ids,
        ]);
        return this._primaryModelManager.getByIds(ids, searchOptions);
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
      const result = JSON.parse(resultJSON);
    }
    return null;
  }

  /**
   * Updates an entity in queries related to the entity.
   * @param entity entity to be updated.
   * @returns Promise of query sync.
   */
  public updateEntityInQueries(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaUpdateGenerator(),
      3,
      this._reverseHashKey,
      entity[this._primaryModelManager.model.id],
      this._key(entity),
      JSON.stringify(VOID_RESULT_STRING),
    );
  }

  /**
   * Gets the lua script for a delete request.
   * @returns lua script.
   */
  private _luaDeleteGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], KEYS[2])
if key then
  redis.call('srem', key, KEYS[2])
  if 0 == redis.call('scard', key) then
    redis.call('sadd', key, ARGV[1])
  end
end`;
  }

  /**
   * Gets the lua script for a get request.
   * @returns lua script.
   */
  private _luaGetGenerator(): string {
    const entitiesAlias = 'entities';
    const idsAlias = 'ids';
    const keysAlias = 'keys';
    const resultAlias = 'result';
    return `local ${idsAlias} = redis.call('smembers', KEYS[1])
if #${idsAlias} == 0 then
  return nil
else
  if ${idsAlias}[0] == '${VOID_RESULT_STRING}' then
    return ${idsAlias}[0]
  else
    local ${keysAlias} = {}
    for i = 1, #${idsAlias} do
      ${keysAlias}[i] = ${this._luaKeyGeneratorFromId(idsAlias + '[i]')}
    end
    local ${entitiesAlias} = redis.call('mget', unpack(${keysAlias}))
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
  private _luaSetQueryGenerator(): string {
    return `if redis.call('sismember', KEYS[1], KEYS[3]) then
  redis.call('srem', KEYS[1], KEYS[3])
end
redis.call('sadd', KEYS[1], unpack(ARGV))
local msetArgs = {}
for i=1, #ARGV do
  msetArgs[2 * i - 1] = ARGV[i]
  msetArgs[2 * i] = KEYS[1]
end
redis.call('hmset', KEYS[2], unpack(msetArgs))`;
  }
  /**
   * Gets the lua script to set a query with no results.
   */
  private _luaSetVoidQueryGenerator(): string {
    return `if (0 == redis.call('scard', KEYS[1])) then
  redis.call('sadd', KEYS[1], ARGV[1])
end`;
  }

  private _luaUpdateGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], KEYS[2])
if key then
  redis.call('srem', key, KEYS[2])
  if 0 == redis.call('scard', key) then
    redis.call('sadd', key, ARGV[1])
  end
  if redis.call('sismember', KEYS[3], ARGV[1]) then
    redis.call('srem', KEYS[3], ARGV[1])
  end
  redis.call('sadd', KEYS[3], ARGV[3])
end`;
  }
}
