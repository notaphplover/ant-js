import { IEntity } from '../../model/IEntity';
import { Model } from '../../model/Model';
import { CacheOptions } from '../../persistence/primary/CacheOptions';
import { EntitySearchOptions } from '../../persistence/primary/EntitySearchOptions';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ITest } from '../ITest';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import { RedisWrapper } from './RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class PrimaryModelManagerTest implements ITest {
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
    this._declareName = 'PrimaryModelManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this.itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided();
      this.itDoesNotCacheEntitiesIfNoCacheOptionIsProvided();
      this.itDoesNotCacheEntityIfNoCacheOptionIsProvided();
      this.itDoesNotSupportCacheIfNotExiststCacheEntities();
      this.itDoesNotSupportTTLAtCacheEntities();
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
      this.itMustPersistZeroEntities();
    });
  }

  private itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided(): void {
    const itsName = 'doesNoCacheIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryModelManager = new PrimaryEntityManager(
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

      await primaryModelManager.cacheEntity(entity1);
      await primaryModelManager.cacheEntity(
        entity1Modified,
        new EntitySearchOptions(CacheOptions.CacheIfNotExist),
      );
      expect(await primaryModelManager.getById(entity1Modified[model.id])).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotCacheEntitiesIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntitiesIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await primaryModelManager.cacheEntities(
        [entity1],
        new EntitySearchOptions(CacheOptions.NoCache),
      );

      expect(await primaryModelManager.getById(entity1[model.id]))
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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await primaryModelManager.cacheEntity(
        entity1,
        new EntitySearchOptions(CacheOptions.NoCache),
      );

      expect(await primaryModelManager.getById(entity1[model.id]))
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
      const primaryModelManager = new PrimaryEntityManager(
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
        await primaryModelManager.cacheEntities(
          [entity1],
          new EntitySearchOptions(CacheOptions.CacheIfNotExist),
        );
        fail();
      } catch {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private itDoesNotSupportTTLAtCacheEntities(): void {
    const itsName = 'doesNotSupportTTLAtCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryModelManager = new PrimaryEntityManager(
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
        await primaryModelManager.cacheEntities(
          [entity1],
          new EntitySearchOptions(CacheOptions.CacheAndOverwrite, 2),
        );
        fail();
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
      const primaryModelManager = new PrimaryEntityManager(
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
        await primaryModelManager.cacheEntities(
          [entity1],
          new EntitySearchOptions('Ohhh yeaaaahh!' as unknown as CacheOptions),
        );
        fail();
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
      const primaryModelManager = new PrimaryEntityManager(
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
        await primaryModelManager.cacheEntity(
          entity1,
          new EntitySearchOptions('Ohhh yeaaaahh!' as unknown as CacheOptions),
        );
        fail();
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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      await primaryModelManager.cacheEntity(entity);
      const luaKey = 'key';
      const luaExpression = primaryModelManager.getKeyGenerationLuaScriptGenerator()(luaKey);
      const valueFound = await this._redis.redis.eval(
`local ${luaKey} = ${entity.id}
return redis.call('get', ${luaExpression})`,
        0,
      );
      if (null == valueFound) {
        fail();
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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      await primaryModelManager.cacheEntity(entity);
      const luaKey = 'key';
      const luaExpression = primaryModelManager.getKeyGenerationLuaScriptGenerator()(luaKey);
      const valueFound = await this._redis.redis.eval(
`local ${luaKey} = ${entity.id}
return redis.call('get', ${luaExpression})`,
        0,
      );
      if (null == valueFound) {
        fail();
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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      await primaryModelManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      await primaryModelManager.deleteEntityFromCache(entity);
      const entityFound = await primaryModelManager.getById(entity[model.id]);

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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const entityFound = await primaryModelManager.getById(entity[model.id]);

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

      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      const entitiesFound = await primaryModelManager.getByIds([
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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      const idToSearch = 3;

      expect(await primaryModelManager.getById(idToSearch)).toBeNull();
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

      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      expect(async () => {
        await primaryModelManager.getByIds(new Array());
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
      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      await primaryModelManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      const entityFound = await primaryModelManager.getById(entity[model.id]);

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

      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      await primaryModelManager.cacheEntities([entity1, entity2]);
      secondaryModelManager.store.length = 0;
      const entitiesFound = await primaryModelManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

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

      const primaryModelManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      expect(async () => {
        await primaryModelManager.cacheEntities(new Array());
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
