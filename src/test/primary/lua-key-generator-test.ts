import { AntJsSearchOptions } from '../../persistence/options/antjs-search-options';
import { AntModel } from '../../model/ant-model';
import { AntPrimaryEntityManager } from '../../persistence/primary/ant-primary-entity-manager';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PrimaryEntityManager } from '../../persistence/primary/primary-entity-manager';
import { RedisWrapper } from './redis-wrapper';
import { Test } from '../../testapi/api/test';
import { luaKeyGenerator } from '../../persistence/primary/lua-key-generator';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

type EntityTest = Entity & {
  id: number;
  field: string;
};

export class LuaKeyGeneratorTest implements Test {
  /**
   * Before all task performed promise.
   */
  protected _beforeAllPromise: Promise<any>;
  /**
   * Declare name for the test
   */
  protected _declareName: string;
  /**
   * Redis Wrapper
   */
  protected _redis: RedisWrapper;

  public constructor(beforeAllPromise: Promise<any>) {
    this._beforeAllPromise = beforeAllPromise;
    this._declareName = LuaKeyGeneratorTest.name;
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustGenerateALuaCodeByAnAlias();
    });
  }

  /**
   * Generates instances needed in almost every test.
   * @param prefix prefix to generate redis keys.
   * @param entities Entities to be stored in the secondary entity manager.
   * @param useNegativeCache True to use negative entitty caching.
   * @returns model, primary entity manager and secondary entity manager instanes.
   */
  private _helperGenerateBaseInstances(
    prefix: string,
    entities: EntityTest[],
    useNegativeCache = true,
  ): [Model<EntityTest>, PrimaryEntityManager<EntityTest>] {
    const model = new AntModel<EntityTest>('id', { prefix });
    const primaryEntityManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, useNegativeCache);
    return [model, primaryEntityManager];
  }

  private _itMustGenerateALuaCodeByAnAlias(): void {
    const itsName = 'must generate a lua code by an alias';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        await primaryEntityManager.cacheMiss(entity[model.id], entity, new AntJsSearchOptions());
        const luaKey = 'key';
        const luaExpression = luaKeyGenerator({ prefix })(luaKey);
        const valueFound = await this._redis.redis.eval(
          `local ${luaKey} = ${entity.id}
return redis.call('get', ${luaExpression})`,
          0,
        );
        if (null == valueFound) {
          fail();
          done();
          return;
        }
        const entityFound = model.primaryToEntity(JSON.parse(valueFound));
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
