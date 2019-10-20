import { AntModel } from '../../model/ant-model';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { ModelManager } from '../../persistence/primary/ModelManager';
import { AntJsDeleteOptions } from '../../persistence/primary/options/AntJsDeleteOptions';
import { AntJsSearchOptions } from '../../persistence/primary/options/AntJsSearchOptions';
import { AntJsUpdateOptions } from '../../persistence/primary/options/AntJsUpdateOptions';
import { CacheMode } from '../../persistence/primary/options/CacheMode';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ISecondaryEntityManager } from '../../persistence/secondary/ISecondaryEntityManager';
import { ITest } from '../../testapi/api/ITest';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from './RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

type IEntityTest = Entity & {
  id: number;
  field: string;
};

type IEntityTestString = Entity & {
  id: string;
  field: string;
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
      this._itDoesNotSupportUndefinedCacheOptionAtCacheEntities();
      this._itDoesNotSupportUndefinedCacheOptionAtCacheEntity();
      this._itGeneratesALuaKeyGeneratorUsingAPrefix();
      this._itMustBeInitializable();
      this._itMustFindAnEntityOutsideCache();
      this._itMustFindNullIfNullIdIsProvided();
      this._itMustFindMultipleEntitiesOutsideCache();
      this._itMustFindMultipleEntitiesOutsideCacheWithNegativeCache();
      this._itMustFindNullIfNoSuccessorIsProvidedAndCacheFails();
      this._itMustFindZeroEntities();
      this._itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet();
      this._itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided();
      this._itMustSearchForAnEntityAndCacheIfTTLIsProvided();
      this._itMustSearchForAnEntityAndFindANegativeCachedEntity();
      this._itMustSearchForAnUnexistingEntity();
      this._itMustSearchForAnUnexistingEntityCachingIfNotExist();
      this._itMustSearchForAnUnexistingEntityWithNegativeCacheAndTTL();
      this._itMustSearchForAnUnexistingEntityWithTTL();
      this._itMustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSet();
      this._itMustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided();
      this._itMustSearchForEntitiesAndCacheThemWithTTL();
      this._itMustSearchForUnexistingEntities();
      this._itMustSearchForUnexistingEntitiesCachingEntitiesIfNotExistWithTTL();
      this._itMustSearchForUnexistingEntitiesWithTTL();
      this._itMustSearchForUnexistingEntitiesWithTTLAndIdAsString();
      this._itMustSearchMultipleEntitiesAndFindANegativeCachedEntity();
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
    entities: IEntityTest[],
    useNegativeCache: boolean = true,
  ): [Model, IPrimaryEntityManager<IEntityTest>, SecondaryEntityManagerMock<IEntityTest>] {
    const model = new AntModel('id', { prefix: prefix });
    const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(model, entities);
    const primaryEntityManager = new PrimaryEntityManager<IEntityTest, ISecondaryEntityManager<IEntityTest>>(
      model,
      this._redis.redis,
      useNegativeCache,
      secondaryEntityManager,
    );
    return [model, primaryEntityManager, secondaryEntityManager];
  }

  private _itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided(): void {
    const itsName = 'doesNoCacheIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: IEntityTest = { id: 1, field: 'sample-1' };
        const entity1Modified: IEntityTest = { id: 1, field: 'sample-modified' };

        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
        ]);

        await primaryEntityManager.get(entity1[model.id]);
        secondaryEntityManager.store[0] = entity1Modified;

        expect(
          await primaryEntityManager.get(
            entity1Modified[model.id],
            new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist)),
          ),
        ).toEqual(entity1);

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itDoesNotCacheEntitiesIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntitiesIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: IEntityTest = { id: 1, field: 'sample-1' };

        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
        ]);

        await primaryEntityManager.mGet(
          [entity1[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.NoCache)),
        );
        secondaryEntityManager.store.pop();

        expect(await primaryEntityManager.get(entity1[model.id])).toBe(null);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itDoesNotCacheEntityIfNoCacheOptionIsProvided(): void {
    const itsName = 'doesNotCacheEntityIfNoCacheOptionIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: IEntityTest = { id: 1, field: 'sample-1' };

        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
        ]);

        await primaryEntityManager.get(
          entity1[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.NoCache)),
        );
        secondaryEntityManager.store.pop();

        expect(await primaryEntityManager.get(entity1[model.id])).toBe(null);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itDoesNotSupportUndefinedCacheOptionAtCacheEntities() {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: IEntityTest = { id: 1, field: 'sample-1' };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);

        /*
         * Expect async to throw error just sucks:
         * https://github.com/jasmine/jasmine/issues/1410
         */
        try {
          await primaryEntityManager.mGet(
            [entity1[model.id]],
            new AntJsSearchOptions(
              new AntJsDeleteOptions(),
              new AntJsUpdateOptions(('Ohhh yeaaaahh!' as unknown) as CacheMode),
            ),
          );
          fail();
          done();
        } catch {
          done();
        }
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itDoesNotSupportUndefinedCacheOptionAtCacheEntity() {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: IEntityTest = { id: 1, field: 'sample-1' };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);

        /*
         * Expect async to throw error just sucks:
         * https://github.com/jasmine/jasmine/issues/1410
         */
        try {
          await primaryEntityManager.get(
            entity1[model.id],
            new AntJsSearchOptions(
              new AntJsDeleteOptions(),
              new AntJsUpdateOptions(('Ohhh yeaaaahh!' as unknown) as CacheMode),
            ),
          );
          fail();
          done();
        } catch {
          done();
        }
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itGeneratesALuaKeyGeneratorUsingAPrefix(): void {
    const itsName = 'generatesALuaKeyGeneratorUsingAPrefix';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        await primaryEntityManager.get(entity[model.id]);
        const luaKey = 'key';
        const luaExpression = primaryEntityManager.getLuaKeyGeneratorFromId()(luaKey);
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
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel('id', { prefix: prefix });
        const secondaryEntityManager = new SecondaryEntityManagerMock<{ id: string }>(model);
        expect(() => {
          // tslint:disable-next-line:no-unused-expression
          new PrimaryEntityManager(model, this._redis.redis, true, secondaryEntityManager);
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindAnEntityOutsideCache(): void {
    const itsName = 'mustFindAnEntityOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.get(entity[model.id]);

        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindMultipleEntitiesOutsideCache(): void {
    const itsName = 'mustFindMultipleEntitiesOutsideCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: IEntityTest = { id: 1, field: 'sample-1' };
        const entity2: IEntityTest = { id: 2, field: 'sample-2' };
        const unexistingEntity: IEntityTest = { id: 3, field: 'sample-3' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1, entity2], false);

        const entitiesFound = await primaryEntityManager.mGet([
          entity1[model.id],
          entity2[model.id],
          unexistingEntity[model.id],
        ]);

        expect(entitiesFound).toContain(entity1);
        expect(entitiesFound).toContain(entity2);
        expect(entitiesFound).not.toContain(unexistingEntity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindMultipleEntitiesOutsideCacheWithNegativeCache(): void {
    const itsName = 'mustFindMultipleEntitiesOutsideCacheWithNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: IEntityTest = { id: 2, field: 'sample-2' };
        const entity2: IEntityTest = { id: 3, field: 'sample-3' };
        const unexistingEntity1: IEntityTest = { id: 1, field: 'sample-1' };
        const unexistingEntity4: IEntityTest = { id: 4, field: 'sample-4' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1, entity2]);

        const entitiesFound = await primaryEntityManager.mGet([
          entity1[model.id],
          entity2[model.id],
          unexistingEntity1[model.id],
          unexistingEntity4[model.id],
        ]);

        expect(entitiesFound).toContain(entity1);
        expect(entitiesFound).toContain(entity2);
        expect(entitiesFound).not.toContain(unexistingEntity1);
        expect(entitiesFound).not.toContain(unexistingEntity4);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindNullIfNoSuccessorIsProvidedAndCacheFails(): void {
    const itsName = 'mustFindNullIfNoSuccessorIsProvidedAndCacheFails';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel('id', { prefix: prefix });
        const primaryEntityManager = new PrimaryEntityManager(model, this._redis.redis, null);
        const idToSearch = 3;

        expect(await primaryEntityManager.get(idToSearch)).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindNullIfNullIdIsProvided(): void {
    const itsName = 'mustFindNullIfNullIdIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());

        expect(await primaryEntityManager.get(null)).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindZeroEntities(): void {
    const itsName = 'mustFindZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());

        expect(async () => {
          await primaryEntityManager.mGet(new Array());
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet(): void {
    const itsName = 'mustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.get(
          entity[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist)),
        );

        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided(): void {
    const itsName = 'mustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.get(
          entity[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist, 10000)),
        );

        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnEntityAndCacheIfTTLIsProvided(): void {
    const itsName = 'mustSearchForAnEntityAndCacheIfTTLIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.get(
          entity[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheAndOverwrite, 10000)),
        );

        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnEntityAndFindANegativeCachedEntity(): void {
    const itsName = 'mustSearchForAnEntityAndFindANegativeCachedEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(
          prefix,
          [entity],
          true,
        );
        const modelManager = new ModelManager(model, this._redis.redis, true, secondaryEntityManager);
        await modelManager.delete(entity.id);
        const entityFound = await primaryEntityManager.get(entity[model.id]);

        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnUnexistingEntity(): void {
    const itsName = 'mustSearchForAnUnexistingEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const entityFound = await primaryEntityManager.get(entity[model.id]);

        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnUnexistingEntityCachingIfNotExist(): void {
    const itsName = 'mustSearchForAnUnexistingEntityCachingIfNotExist';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const entityFound = await primaryEntityManager.get(
          entity[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist)),
        );

        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnUnexistingEntityWithNegativeCacheAndTTL(): void {
    const itsName = 'mustSearchForAnUnexistingEntityWithNegativeCacheAndTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array(), true);
        const entityFound = await primaryEntityManager.get(
          entity[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheAndOverwrite, 10000)),
        );

        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForAnUnexistingEntityWithTTL(): void {
    const itsName = 'mustSearchForAnUnexistingEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const entityFound = await primaryEntityManager.get(
          entity[model.id],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheAndOverwrite, 10000)),
        );

        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSet(): void {
    const itsName = 'mustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.mGet(
          [entity[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist)),
        );

        expect(entityFound).toEqual([entity]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided(): void {
    const itsName = 'mustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.mGet(
          [entity[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist, 10000)),
        );

        expect(entityFound).toEqual([entity]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForEntitiesAndCacheThemWithTTL(): void {
    const itsName = 'mustSearchForEntitiesAndCacheThemWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const entityFound = await primaryEntityManager.mGet(
          [entity[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheAndOverwrite, 10000)),
        );

        expect(entityFound).toEqual([entity]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForUnexistingEntities(): void {
    const itsName = 'mustSearchForUnexistingEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const entityFound = await primaryEntityManager.mGet([entity[model.id]]);

        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForUnexistingEntitiesCachingEntitiesIfNotExistWithTTL(): void {
    const itsName = 'mustSearchForUnexistingEntitiesCachingEntitiesIfNotExistWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const entityFound = await primaryEntityManager.mGet(
          [entity[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheIfNotExist, 10000)),
        );

        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForUnexistingEntitiesWithTTL(): void {
    const itsName = 'mustSearchForUnexistingEntitiesWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const entityFound = await primaryEntityManager.mGet(
          [entity[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheAndOverwrite, 10000)),
        );

        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchForUnexistingEntitiesWithTTLAndIdAsString(): void {
    const itsName = 'mustSearchForUnexistingEntitiesWithTTLAndIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTestString = { id: 'id0', field: 'sample' };
        const model = new AntModel('id', { prefix: prefix });
        const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTestString>(model, new Array());
        const primaryEntityManager = new PrimaryEntityManager(model, this._redis.redis, true, secondaryEntityManager);
        const entityFound = await primaryEntityManager.mGet(
          [entity[model.id]],
          new AntJsSearchOptions(new AntJsDeleteOptions(), new AntJsUpdateOptions(CacheMode.CacheAndOverwrite, 10000)),
        );

        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSearchMultipleEntitiesAndFindANegativeCachedEntity(): void {
    const itsName = 'mustSearchMultipleEntitiesAndFindANegativeCachedEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: IEntityTest = { id: 0, field: 'sample' };
        const entity2: IEntityTest = { id: 1, field: 'sample-2' };
        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity,
          entity2,
        ]);
        const modelManager = new ModelManager(model, this._redis.redis, true, secondaryEntityManager);
        await modelManager.delete(entity.id);
        const entityFound = await primaryEntityManager.mGet([entity[model.id], entity2[model.id]]);

        expect(entityFound).toEqual([entity2]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
