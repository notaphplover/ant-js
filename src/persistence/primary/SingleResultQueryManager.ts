import { IEntity } from '../../model/IEntity';
import { IEntitySearchOptions } from './IEntitySearchOptions';
import { PrimaryQueryManager } from './PrimaryQueryManager';

const VOID_RESULT_STRING = 'v\x06\x15';

export abstract class SingleResultQueryManager<
  TEntity extends IEntity
> extends PrimaryQueryManager<
  TEntity,
  (params: any) => Promise<number | string>,
  Promise<TEntity>
> {
  /**
   * Syncs the remove of an entity in cache.
   * @param entity deleted entity.
   * @returns Promise of query sinc
   */
  public deleteEntityInQueries(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaDeleteGenerator(),
      1,
      this._reverseHashKey,
      JSON.stringify(entity[this.model.id]),
      JSON.stringify(VOID_RESULT_STRING),
    );
  }
  /**
   * Gets the result of a query.
   * @param params Query parameters.
   * @param searchOptions Search options.
   */
  public async get(
    params: any,
    searchOptions?: IEntitySearchOptions,
  ): Promise<TEntity> {
    const key = this._key(params);
    const luaScript = this._luaGetGenerator();
    const resultJSON = await this._redis.eval(luaScript, 1, key);
    if (null == resultJSON) {
      const id = await this._query(params);
      if (null == id) {
        this._redis.set(key, JSON.stringify(VOID_RESULT_STRING));
      } else {
        this._redis.set(key, JSON.stringify(id));
        this._redis.hset(this._reverseHashKey, JSON.stringify(id), key);
      }
      return await this._primaryModelManager.getById(id, searchOptions);
    } else {
      const result = JSON.parse(resultJSON);
      const resultType = typeof result;
      if ('object' === resultType) {
        return result;
      }
      if ('number' === resultType) {
        return this._primaryModelManager.getById(result, searchOptions);
      }
      if ('string' === resultType) {
        if (VOID_RESULT_STRING === result) {
          return null;
        } else {
          return this._primaryModelManager.getById(result, searchOptions);
        }
      }
      throw new Error(`Query "${key}" corrupted!`);
    }
  }

  /**
   * Syncs the update of an entity in cache.
   * @param entity updated entity.
   */
  public updateEntityInQueries(entity: TEntity): Promise<void> {
    return this._redis.eval(
      this._luaUpdateGenerator(),
      2,
      this._reverseHashKey,
      this._key(entity),
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
  redis.call('set', key, ARGV[2])
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
   * Gets the lua script for an update request.
   * @returns lua script.
   */
  private _luaUpdateGenerator(): string {
    return `local key = redis.call('hget', KEYS[1], ARGV[1])
if key then
  redis.call('del', key)
  redis.call('set', KEYS[2], ARGV[1])
end`;
  }
}
