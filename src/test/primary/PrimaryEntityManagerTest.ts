import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { Model } from '../../model/Model';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { ModelManager } from '../../persistence/primary/ModelManager';
import { CacheMode } from '../../persistence/primary/options/CacheMode';
import { CacheOptions } from '../../persistence/primary/options/CacheOptions';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ITest } from '../ITest';
import { SecondaryEntityManagerMock } from '../secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from './RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

type IEntityTest = IEntity & {
  id: number,
  field: string,
};

export class PrimaryEntityManagerTest implements ITest {
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
    this._declareName = 'PrimaryEntityManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided();
      this._itDoesNotCacheEntitiesIfNoCacheOptionIsProvided();
      this._itDoesNotCacheEntityIfNoCacheOptionIsProvided();
      this._itDoesNotSupportCacheIfNotExiststCacheEntities();
      this._itDoesNotSupportUndefinedCacheOptionAtCacheEntities();
      this._itDoesNotSupportUndefinedCacheOptionAtCacheEntity();
      this._itGeneratesALuaKeyGeneratorUsingAPrefix();
      this._itGeneratesALuaKeyGeneratorUsingASuffix();
      this._itMustBeInitializable();
      this._itMustFindAnEntityOutsideCache();
      this._itMustFindNullIfNullIdIsProvided();
      this._itMustFindMultipleEntitiesOutsideCache();
      this._itMustFindNullIfNoSuccessorIsProvidedAndCacheFails();
      this._itMustFindZeroEntities();
      this._itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet();
      this._itMustSearchForAnEntityAndFindANegativeCachedEntity();
      this._itMustSearchForEntitiesAndCacheThemWithTTL();
      this._itMustSearchForUnexistingEntities();
      this._itMustSearchMultipleEntitiesAndFindANegativeCachedEntity();
    });
  }

  /**
   * Generates instances needed in almost every test.
   * @param prefix prefix to generate redis keys.
   * @returns model, primary entity manager and secondary entity manager instanes.
   */
  private _helperGenerateBaseInstances(
    prefix: string,
    entities: IEntityTest[],
  ): [
    IModel,
    IPrimaryEntityManager<IEntityTest>,
    SecondaryEntityManagerMock<IEntityTest>,
  ] {
    const model = new Model('id', { prefix: prefix });
    const secondaryEntityManager =
        new SecondaryEntityManagerMock<IEntityTest>(model, entities);
    const primaryEntityManager = new PrimaryEntityManager<IEntityTest>(
      model,
      this._redis.redis,
      secondaryEntityManager,
    );
    return [
      model,
      primaryEntityManager,
      secondaryEntityManager,
    ];
  }

  private _itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided(): void {
    const itsName = 'doesNoCacheIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const entity1: IEntityTest = {id: 1, field: 'sample-1'};
      const entity1Modified: IEntityTest = {id: 1, field: 'sample-modified'};

      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);

      await primaryEntityManager.getById(entity1[model.id]);
      secondaryEntityManager.store[0] = entity1Modified;

      expect(await primaryEntityManager.getById(
        entity1Modified[model.id],
        new CacheOptions(CacheMode.CacheIfNotExist),
      )).toEqual(entity1);

      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotCacheEntitiesIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntitiesIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const entity1: IEntityTest = {id: 1, field: 'sample-1'};

      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);

      await primaryEntityManager.getByIds(
        [entity1[model.id]],
        new CacheOptions(CacheMode.NoCache),
      );
      secondaryEntityManager.store.pop();

      expect(await primaryEntityManager.getById(entity1[model.id])).toBe(null);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotCacheEntityIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntityIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const entity1: IEntityTest = {id: 1, field: 'sample-1'};

      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);

      await primaryEntityManager.getById(
        entity1[model.id],
        new CacheOptions(CacheMode.NoCache),
      );
      secondaryEntityManager.store.pop();

      expect(await primaryEntityManager.getById(entity1[model.id])).toBe(null);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotSupportCacheIfNotExiststCacheEntities(): void {
    const itsName = 'doesNotSupportCacheIfNotExiststCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const entity1: IEntityTest = {id: 1, field: 'sample-1'};

      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.getByIds(
          [entity1[model.id]],
          new CacheOptions(CacheMode.CacheIfNotExist),
        );
        fail();
        done();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotSupportUndefinedCacheOptionAtCacheEntities() {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const entity1: IEntityTest = {id: 1, field: 'sample-1'};

      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.getByIds(
          [entity1[model.id]],
          new CacheOptions('Ohhh yeaaaahh!' as unknown as CacheMode),
        );
        fail();
        done();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotSupportUndefinedCacheOptionAtCacheEntity() {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const entity1: IEntityTest = {id: 1, field: 'sample-1'};

      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.getById(
          entity1[model.id],
          new CacheOptions('Ohhh yeaaaahh!' as unknown as CacheMode),
        );
        fail();
        done();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private _itGeneratesALuaKeyGeneratorUsingAPrefix(): void {
    const itsName = 'generatesALuaKeyGeneratorUsingAPrefix';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);
      await primaryEntityManager.getById(entity[model.id]);
      const luaKey = 'key';
      const luaExpression = primaryEntityManager.getKeyGenerationLuaScriptGenerator()(luaKey);
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
      const entityFound = JSON.parse(valueFound);
      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itGeneratesALuaKeyGeneratorUsingASuffix(): void {
    const itsName = 'generatesALuaKeyGeneratorUsingASuffix';
    const suffix = '/' + this._declareName + '/' + itsName;
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', {suffix: suffix});
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const secondaryEntityManager = new SecondaryEntityManagerMock(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryEntityManager,
      );
      await primaryEntityManager.getById(entity[model.id]);
      const luaKey = 'key';
      const luaExpression = primaryEntityManager.getKeyGenerationLuaScriptGenerator()(luaKey);
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
      const entityFound = JSON.parse(valueFound);
      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', {prefix: prefix});
      const secondaryEntityManager =
        new SecondaryEntityManagerMock<{id: string}>(model);
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new PrimaryEntityManager(
          model,
          this._redis.redis,
          secondaryEntityManager,
        );
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustFindAnEntityOutsideCache(): void {
    const itsName = 'mustFindAnEntityOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustFindMultipleEntitiesOutsideCache(): void {
    const itsName = 'mustFindMultipleEntitiesOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {id: 1, field: 'sample-1'};
      const entity2: IEntityTest = {id: 2, field: 'sample-2'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1, entity2]);

      const entitiesFound = await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustFindNullIfNoSuccessorIsProvidedAndCacheFails(): void {
    const itsName = 'mustFindNullIfNoSuccessorIsProvidedAndCacheFails';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const idToSearch = 3;

      expect(await primaryEntityManager.getById(idToSearch)).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustFindNullIfNullIdIsProvided(): void {
    const itsName = 'mustFindNullIfNullIdIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());

      expect(await primaryEntityManager.getById(null)).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustFindZeroEntities(): void {
    const itsName = 'mustFindZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());

      expect(async () => {
        await primaryEntityManager.getByIds(new Array());
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet(): void {
    const itsName = 'mustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);
      const entityFound = await primaryEntityManager.getById(
        entity[model.id],
        new CacheOptions(CacheMode.CacheIfNotExist),
      );

      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustSearchForAnEntityAndFindANegativeCachedEntity(): void {
    const itsName = 'mustSearchForAnEntityAndFindANegativeCachedEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        primaryEntityManager,
        true,
      );
      await modelManager.delete(entity.id);
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustSearchForEntitiesAndCacheThemWithTTL(): void {
    const itsName = 'mustSearchForEntitiesAndCacheThemWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);
      const entityFound = await primaryEntityManager.getByIds(
        [entity[model.id]],
        new CacheOptions(CacheMode.CacheAndOverwrite, 1000),
      );

      expect(entityFound).toEqual([entity]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustSearchForUnexistingEntities(): void {
    const itsName = 'mustSearchForUnexistingEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entityFound = await primaryEntityManager.getByIds([
        entity[model.id],
      ]);

      expect(entityFound).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustSearchMultipleEntitiesAndFindANegativeCachedEntity(): void {
    const itsName = 'mustSearchMultipleEntitiesAndFindANegativeCachedEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntityTest = {id: 0, field: 'sample'};
      const entity2: IEntityTest = {id: 1, field: 'sample-2'};
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity, entity2]);
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        primaryEntityManager,
        true,
      );
      await modelManager.delete(entity.id);
      const entityFound = await primaryEntityManager.getByIds([
        entity[model.id],
        entity2[model.id],
      ]);

      expect(entityFound).toEqual([entity2]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
