import { IEntity } from '../../model/IEntity';
import { Model } from '../../model/Model';
import { CacheMode } from '../../persistence/primary/CacheMode';
import { EntitySearchOptions } from '../../persistence/primary/EntitySearchOptions';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ITest } from '../ITest';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
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
      this.itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided();
      this.itDoesNotCacheEntitiesIfNoCacheOptionIsProvided();
      this.itDoesNotCacheEntityIfNoCacheOptionIsProvided();
      this.itDoesNotSupportCacheIfNotExiststCacheEntities();
      this.itDoesNotSupportUndefinedCacheOptionAtCacheEntities();
      this.itDoesNotSupportUndefinedCacheOptionAtCacheEntity();
      this.itGeneratesALuaKeyGeneratorUsingAPrefix();
      this.itGeneratesALuaKeyGeneratorUsingASuffix();
      this.itMustBeInitializable();
      this.itMustDeleteAnEntity();
      this.itMustFindAnEntityOutsideCache();
      this.itMustFindMultipleEntitiesOutsideCache();
      this.itMustFindNullIfNoSuccessorIsProvidedAndCacheFails();
      this.itMustFindZeroEntities();
      this.itMustPersistAnEntity();
      this.itMustPersistMultipleEntities();
      this.itMustPersistMultipleEntitiesWithTTL();
      this.itMustPersistZeroEntities();
    });
  }

  private itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided(): void {
    const itsName = 'doesNoCacheIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1Modified: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-modified'};

      await primaryEntityManager.cacheEntity(entity1);
      await primaryEntityManager.cacheEntity(
        entity1Modified,
        new EntitySearchOptions(CacheMode.CacheIfNotExist),
      );
      expect(await primaryEntityManager.getById(entity1Modified[model.id])).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotCacheEntitiesIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntitiesIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await primaryEntityManager.cacheEntities(
        [entity1],
        new EntitySearchOptions(CacheMode.NoCache),
      );

      expect(await primaryEntityManager.getById(entity1[model.id]))
        .toBe(null);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotCacheEntityIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntityIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await primaryEntityManager.cacheEntity(
        entity1,
        new EntitySearchOptions(CacheMode.NoCache),
      );

      expect(await primaryEntityManager.getById(entity1[model.id]))
        .toBe(null);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotSupportCacheIfNotExiststCacheEntities(): void {
    const itsName = 'doesNotSupportCacheIfNotExiststCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.cacheEntities(
          [entity1],
          new EntitySearchOptions(CacheMode.CacheIfNotExist),
        );
        fail();
        done();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotSupportUndefinedCacheOptionAtCacheEntities() {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.cacheEntities(
          [entity1],
          new EntitySearchOptions('Ohhh yeaaaahh!' as unknown as CacheMode),
        );
        fail();
        done();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotSupportUndefinedCacheOptionAtCacheEntity() {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryEntityManager.cacheEntity(
          entity1,
          new EntitySearchOptions('Ohhh yeaaaahh!' as unknown as CacheMode),
        );
        fail();
        done();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private itGeneratesALuaKeyGeneratorUsingAPrefix(): void {
    const itsName = 'generatesALuaKeyGeneratorUsingAPrefix';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      await primaryEntityManager.cacheEntity(entity);
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

  private itGeneratesALuaKeyGeneratorUsingASuffix(): void {
    const itsName = 'generatesALuaKeyGeneratorUsingASuffix';
    const suffix = '/' + this._declareName + '/' + itsName;
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id'], {suffix: suffix});
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      await primaryEntityManager.cacheEntity(entity);
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

  private itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id'], {prefix: prefix});
      const secondaryModelManager =
        new SecondaryModelManagerMock<{id: string}>(model);
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new PrimaryEntityManager(
          model,
          this._redis.redis,
          secondaryModelManager,
        );
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustDeleteAnEntity(): void {
    const itsName = 'mustDeleteAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      await primaryEntityManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      await primaryEntityManager.deleteEntityFromCache(entity);
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustFindAnEntityOutsideCache(): void {
    const itsName = 'mustFindAnEntityOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustFindMultipleEntitiesOutsideCache(): void {
    const itsName = 'mustFindMultipleEntitiesOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1, entity2]);

      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      const entitiesFound = await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustFindNullIfNoSuccessorIsProvidedAndCacheFails(): void {
    const itsName = 'mustFindNullIfNoSuccessorIsProvidedAndCacheFails';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
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

  private itMustFindZeroEntities(): void {
    const itsName = 'mustFindZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model);

      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      expect(async () => {
        await primaryEntityManager.getByIds(new Array());
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPersistAnEntity(): void {
    const itsName = 'mustPersistAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      await primaryEntityManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      const entityFound = await primaryEntityManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPersistMultipleEntities(): void {
    const itsName = 'mustPersistMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1, entity2]);

      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      await primaryEntityManager.cacheEntities([entity1, entity2]);
      secondaryModelManager.store.length = 0;
      const entitiesFound = await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPersistMultipleEntitiesWithTTL(): void {
    const itsName = 'mustPersistMultipleEntitiesWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1, entity2]);

      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const options = new EntitySearchOptions(CacheMode.CacheAndOverwrite, 3600);
      await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ], options);
      secondaryModelManager.store.length = 0;
      const entitiesFound = await primaryEntityManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ], options);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPersistZeroEntities(): void {
    const itsName = 'mustPersistZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model);

      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      expect(async () => {
        await primaryEntityManager.cacheEntities(new Array());
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
