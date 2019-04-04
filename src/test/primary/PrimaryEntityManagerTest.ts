import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { Model } from '../../model/Model';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { CacheMode } from '../../persistence/primary/options/CacheMode';
import { CacheOptions } from '../../persistence/primary/options/CacheOptions';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ITest } from '../ITest';
import { SecondaryEntityManagerMock } from '../secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from './RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

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
      this._itMustDeleteAnEntity();
      this._itMustDeleteMultipleEntitities();
      this._itMustDeleteZeroEntitities();
      this._itMustFindAnEntityOutsideCache();
      this._itMustFindNullIfNullIdIsProvided();
      this._itMustFindMultipleEntitiesOutsideCache();
      this._itMustFindNullIfNoSuccessorIsProvidedAndCacheFails();
      this._itMustFindZeroEntities();
      this._itMustPersistAnEntity();
      this._itMustPersistMultipleEntities();
      this._itMustPersistMultipleEntitiesWithTTL();
      this._itMustPersistZeroEntities();
    });
  }

  /**
   * Generates instances needed in almost every test.
   * @param prefix prefix to generate redis keys.
   * @returns model, primary entity manager and secondary entity manager instanes.
   */
  private _helperGenerateBaseInstances(
    prefix: string,
    entities: Array<IEntity & {
      id: number,
      field: string,
    }>,
  ): [
    IModel,
    IPrimaryEntityManager<IEntity & {
      id: number,
      field: string,
    }>,
    SecondaryEntityManagerMock<IEntity & {
      id: number,
      field: string,
    }>,
  ] {
    const model = new Model('id', { prefix: prefix });
    const secondaryEntityManager =
        new SecondaryEntityManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, entities);
    const primaryEntityManager = new PrimaryEntityManager<IEntity & {
      id: number,
      field: string,
    }>(
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
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1Modified: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-modified'};

      await primaryEntityManager.update(entity1);
      await primaryEntityManager.update(
        entity1Modified,
        new CacheOptions(CacheMode.CacheIfNotExist),
      );
      expect(await primaryEntityManager.getById(entity1Modified[model.id])).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotCacheEntitiesIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntitiesIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await primaryEntityManager.mUpdate(
        [entity1],
        new CacheOptions(CacheMode.NoCache),
      );

      expect(await primaryEntityManager.getById(entity1[model.id]))
        .toBe(null);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotCacheEntityIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntityIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        model,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await primaryEntityManager.update(
        entity1,
        new CacheOptions(CacheMode.NoCache),
      );

      expect(await primaryEntityManager.getById(entity1[model.id]))
        .toBe(null);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itDoesNotSupportCacheIfNotExiststCacheEntities(): void {
    const itsName = 'doesNotSupportCacheIfNotExiststCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.mUpdate(
          [entity1],
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
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.mUpdate(
          [entity1],
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
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.update(
          entity1,
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
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      await primaryEntityManager.update(entity);
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
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      await primaryEntityManager.update(entity);
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

  private _itMustDeleteAnEntity(): void {
    const itsName = 'mustDeleteAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);

      await primaryEntityManager.update(entity);
      secondaryEntityManager.store.length = 0;
      await primaryEntityManager.delete(entity);
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteMultipleEntitities(): void {
    const itsName = 'mustDeleteMultipleEntitities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);

      await primaryEntityManager.update(entity);
      secondaryEntityManager.store.length = 0;
      await primaryEntityManager.mDelete([entity]);
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteZeroEntitities(): void {
    const itsName = 'mustDeleteZeroEntitities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);

      await primaryEntityManager.update(entity);
      secondaryEntityManager.store.length = 0;
      await primaryEntityManager.mDelete(new Array());
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustFindAnEntityOutsideCache(): void {
    const itsName = 'mustFindAnEntityOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
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
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
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

  private _itMustPersistAnEntity(): void {
    const itsName = 'mustPersistAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);

      await primaryEntityManager.update(entity);
      secondaryEntityManager.store.length = 0;
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPersistMultipleEntities(): void {
    const itsName = 'mustPersistMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1, entity2]);

      await primaryEntityManager.mUpdate([entity1, entity2]);
      secondaryEntityManager.store.length = 0;
      const entitiesFound = await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPersistMultipleEntitiesWithTTL(): void {
    const itsName = 'mustPersistMultipleEntitiesWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1, entity2]);
      const options = new CacheOptions(CacheMode.CacheAndOverwrite, 3600);
      await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ], options);
      secondaryEntityManager.store.length = 0;
      const entitiesFound = await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ], options);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPersistZeroEntities(): void {
    const itsName = 'mustPersistZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());

      expect(async () => {
        await primaryEntityManager.mUpdate(new Array());
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
