import { AntJsSearchOptions } from '../../persistence/options/antjs-search-options';
import { AntModel } from '../../model/ant-model';
import { AntPrimaryEntityManager } from '../../persistence/primary/ant-primary-entity-manager';
import { CacheMode } from '../../persistence/options/cache-mode';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PrimaryEntityManager } from '../../persistence/primary/primary-entity-manager';
import { PrimaryEntityManagerForTest } from './primary-entity-manager-for-test';
import { RedisWrapper } from './redis-wrapper';
import { Test } from '../../testapi/api/test';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

type EntityTest = Entity & {
  id: number;
  field: string;
};

type IEntityTestString = Entity & {
  id: string;
  field: string;
};

export class PrimaryEntityManagerTest implements Test {
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
      this._itInvokesEntityToPrimaryAtGet();
      this._itInvokesEntityToPrimaryAtMGet();
      this._itInvokesPrimaryToEntityAtGet();
      this._itInvokesPrimaryToEntityAtMGet();
      this._itMustBeInitializable();
      this._itMustCacheAnEntity();
      this._itMustCacheAnEntityDeletingAMissingEntity();
      this._itMustCacheAnEntityDeletingAMissingEntityWithCacheAndOverwriteModeAndTtl();
      this._itMustCacheAnEntityDeletingAMissingEntityWithNoCacheMode();
      this._itMustCacheAnEntityWithCacheAndOverWriteModeAndTTL();
      this._itMustCacheMultipleEntities();
      this._itMustCacheMultipleEntitiesDeletingMissingEntity();
      this._itMustCacheMultipleEntitiesDeletingAMissingEntityWithCacheAndOverwriteModeAndTtl();
      this._itMustCacheMultipleEntitiesDeletingAMissingEntityWithNoCacheMode();
      this._itMustCacheMultipleEntitiesWithCacheAndOverWriteModeAndTTL();
      this._itMustFindAnEntityAtCache();
      this._itMustFindNullIfNullIdIsProvided();
      this._itMustFindMultipleEntitiesAtCache();
      this._itMustFindMultipleEntitiesOutsideCacheWithNegativeCache();
      this._itMustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails();
      this._itMustFindZeroEntities();
      this._itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSet();
      this._itMustSearchForAnEntityAndCacheIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided();
      this._itMustSearchForAnEntityAndCacheIfTTLIsProvided();
      this._itMustSearchForAnEntityAndFindANegativeCachedEntity();
      this._itMustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSet();
      this._itMustSearchForEntitiesAndCacheThemIfNotExistsWhenCacheIfNotExistsIsSetAntTTLIsProvided();
      this._itMustSearchForEntitiesAndCacheThemWithTTL();
      this._itMustSearchForUnexistingEntities();
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
    useNegativeCache = true,
  ): [Model<EntityTest>, PrimaryEntityManager<EntityTest>] {
    const model = new AntModel<EntityTest>('id', { prefix });
    const primaryEntityManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, useNegativeCache);
    return [model, primaryEntityManager];
  }

  private _itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided(): void {
    const itsName = 'doesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = { field: 'sample-1', id: 1 };
        const entity1Modified: EntityTest = { field: 'sample-2', id: 1 };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMiss(entity1[model.id], entity1, new AntJsSearchOptions());

        await primaryEntityManager.cacheMiss(
          entity1[model.id],
          entity1,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheIfNotExist }),
        );

        expect(await primaryEntityManager.get(entity1Modified[model.id])).toEqual(entity1);

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

        const entity1: EntityTest = { field: 'sample-1', id: 1 };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMisses(
          [entity1[model.id]],
          [entity1],
          new AntJsSearchOptions({ cacheMode: CacheMode.NoCache }),
        );

        expect(await primaryEntityManager.get(entity1[model.id])).toBeUndefined();
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

        const entity1: EntityTest = { field: 'sample-1', id: 1 };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMiss(
          entity1[model.id],
          entity1,
          new AntJsSearchOptions({ cacheMode: CacheMode.NoCache }),
        );

        expect(await primaryEntityManager.get(entity1[model.id])).toBeUndefined();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itDoesNotSupportUndefinedCacheOptionAtCacheEntities(): void {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = { field: 'sample-1', id: 1 };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        /*
         * Expect async to throw error just sucks:
         * https://github.com/jasmine/jasmine/issues/1410
         */
        try {
          await primaryEntityManager.cacheMisses(
            [entity1[model.id]],
            [entity1],
            new AntJsSearchOptions({
              cacheMode: ('Ohhh yeaaaahh!' as unknown) as CacheMode,
            }),
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

  private _itDoesNotSupportUndefinedCacheOptionAtCacheEntity(): void {
    const itsName = 'doesNotSupportUndefinedCacheOptionAtCacheEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = { field: 'sample-1', id: 1 };

        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        /*
         * Expect async to throw error just sucks:
         * https://github.com/jasmine/jasmine/issues/1410
         */
        try {
          await primaryEntityManager.cacheMiss(
            entity1[model.id],
            entity1,
            new AntJsSearchOptions({ cacheMode: ('Ohhh yeaaaahh!' as unknown) as CacheMode }),
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

  private _itInvokesEntityToPrimaryAtGet(): void {
    const itsName = 'invokesEntityToPrimaryAtGet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const primarySample = { less: 'is more' };
        const model: Model<EntityTest> = {
          entityToPrimary: () => primarySample,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: () => [primarySample],
          mPrimaryToEntity: (primaries) => primaries,
          primaryToEntity: (primary) => primary,
        };

        const entitySample: EntityTest = { field: 'less is more', id: 0 };

        const primaryEntityManager = new PrimaryEntityManagerForTest<EntityTest>(model, this._redis.redis, false);

        await primaryEntityManager.cacheMiss(entitySample.id, entitySample, new AntJsSearchOptions());
        const redisEntry = await this._redis.redis.get(primaryEntityManager.getKey(entitySample.id));
        const parsedRedisEntry = JSON.parse(redisEntry);
        expect(parsedRedisEntry).toEqual((primarySample as unknown) as EntityTest);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itInvokesEntityToPrimaryAtMGet(): void {
    const itsName = 'invokesEntityToPrimaryAtMGet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const primarySample = { id: 0, less: 'is more' };
        const model: Model<EntityTest> = {
          entityToPrimary: () => primarySample,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: () => [primarySample],
          mPrimaryToEntity: (primaries) => primaries,
          primaryToEntity: (primary) => primary,
        };

        const entitySample: EntityTest = { field: 'less is more', id: 0 };

        const primaryEntityManager = new PrimaryEntityManagerForTest<EntityTest>(model, this._redis.redis, false);

        await primaryEntityManager.cacheMisses([entitySample.id], [entitySample], new AntJsSearchOptions());
        const redisEntry = await this._redis.redis.get(primaryEntityManager.getKey(entitySample.id));
        const parsedRedisEntry = JSON.parse(redisEntry);
        expect(parsedRedisEntry).toEqual((primarySample as unknown) as EntityTest);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itInvokesPrimaryToEntityAtGet(): void {
    const itsName = 'invokesPrimaryToEntityAtGet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const fakeEntitySample = { less: 'is more' };
        const model: Model<EntityTest> = {
          entityToPrimary: (entity) => entity,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: (entities) => entities,
          mPrimaryToEntity: () => [(fakeEntitySample as unknown) as EntityTest],
          primaryToEntity: () => (fakeEntitySample as unknown) as EntityTest,
        };

        const entitySample: EntityTest = { field: 'less is more', id: 0 };

        const primaryEntityManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, false);

        await primaryEntityManager.cacheMiss(entitySample.id, entitySample, new AntJsSearchOptions());
        // Read from cache. Now we should achieve a cache hit with the transformed entity
        const entityFound = await primaryEntityManager.get(entitySample.id);
        expect(entityFound).toEqual((fakeEntitySample as unknown) as EntityTest);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itInvokesPrimaryToEntityAtMGet(): void {
    const itsName = 'invokesPrimaryToEntityAtMGet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const fakeEntitySample = { less: 'is more' };
        const model: Model<EntityTest> = {
          entityToPrimary: (entity) => entity,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: (entities) => entities,
          mPrimaryToEntity: () => [(fakeEntitySample as unknown) as EntityTest],
          primaryToEntity: () => (fakeEntitySample as unknown) as EntityTest,
        };

        const entitySample: EntityTest = { field: 'less is more', id: 0 };

        const primaryEntityManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, false);
        // Write to cache
        await primaryEntityManager.cacheMisses([entitySample.id], [entitySample], new AntJsSearchOptions());
        // Read from cache. Now we should achieve a cache hit with the transformed entity
        const entityFound = await primaryEntityManager.mGet([entitySample.id]);
        expect(entityFound).toEqual([(fakeEntitySample as unknown) as EntityTest]);
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
        const model = new AntModel<{ id: string }>('id', { prefix });
        expect(() => {
          new AntPrimaryEntityManager(model, this._redis.redis, true);
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheAnEntity(): void {
    const itsName = 'mustCacheAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMiss(entity[model.id], entity, new AntJsSearchOptions());
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheAnEntityDeletingAMissingEntity(): void {
    const itsName = 'mustCacheAnEntityDeletingAMissingEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMiss(entity[model.id], entity, new AntJsSearchOptions());
        await primaryManager.cacheMiss(entity[model.id], null, new AntJsSearchOptions());
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheAnEntityDeletingAMissingEntityWithCacheAndOverwriteModeAndTtl(): void {
    const itsName = 'mustCacheAnEntityDeletingAMissingEntityWithCacheAndOverwriteModeAndTtl';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMiss(
          entity[model.id],
          entity,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );
        await primaryManager.cacheMiss(
          entity[model.id],
          null,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheAnEntityDeletingAMissingEntityWithNoCacheMode(): void {
    const itsName = 'mustCacheAnEntityDeletingAMissingEntityWithNoCacheMode';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMiss(
          entity[model.id],
          entity,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite }),
        );
        await primaryManager.cacheMiss(
          entity[model.id],
          null,
          new AntJsSearchOptions({ cacheMode: CacheMode.NoCache }),
        );
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheAnEntityWithCacheAndOverWriteModeAndTTL(): void {
    const itsName = 'mustCacheAnEntityWithCacheAndOverWriteModeAndTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMiss(
          entity[model.id],
          entity,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheMultipleEntities(): void {
    const itsName = 'mustCacheMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMisses([entity[model.id]], [entity], new AntJsSearchOptions());
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheMultipleEntitiesDeletingMissingEntity(): void {
    const itsName = 'mustCacheMultipleEntitiesDeletingAMissingEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMisses([entity[model.id]], [entity], new AntJsSearchOptions());
        await primaryManager.cacheMisses([entity[model.id]], new Array(), new AntJsSearchOptions());
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheMultipleEntitiesDeletingAMissingEntityWithCacheAndOverwriteModeAndTtl(): void {
    const itsName = 'mustCacheMultipleEntitiesDeletingAMissingEntityWithCacheAndOverwriteModeAndTtl';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMisses(
          [entity[model.id]],
          [entity],
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );
        await primaryManager.cacheMisses(
          [entity[model.id]],
          new Array(),
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheMultipleEntitiesDeletingAMissingEntityWithNoCacheMode(): void {
    const itsName = 'mustCacheMultipleEntitiesDeletingAMissingEntityWithNoCacheMode';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMisses(
          [entity[model.id]],
          [entity],
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite }),
        );
        await primaryManager.cacheMisses(
          [entity[model.id]],
          [],
          new AntJsSearchOptions({ cacheMode: CacheMode.NoCache }),
        );
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheMultipleEntitiesWithCacheAndOverWriteModeAndTTL(): void {
    const itsName = 'mustCacheMultipleEntitiesWithCacheAndOverWriteModeAndTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel<EntityTest>('id', { prefix });
        const primaryManager = new AntPrimaryEntityManager<EntityTest>(model, this._redis.redis, true);
        const entity: EntityTest = {
          field: 'sample-field',
          id: 1,
        };
        await primaryManager.cacheMisses(
          [entity[model.id]],
          [entity],
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );
        const entityFound = await primaryManager.get(entity[model.id]);
        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindAnEntityAtCache(): void {
    const itsName = 'mustFindAnEntityAtCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);
        await primaryEntityManager.cacheMiss(entity[model.id], entity, new AntJsSearchOptions());
        const entityFound = await primaryEntityManager.get(entity[model.id]);

        expect(entityFound).toEqual(entity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindMultipleEntitiesAtCache(): void {
    const itsName = 'mustFindMultipleEntitiesAtCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = { field: 'sample-1', id: 1 };
        const entity2: EntityTest = { field: 'sample-2', id: 2 };
        const unexistingEntity: EntityTest = { field: 'sample-3', id: 3 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, false);

        await primaryEntityManager.cacheMisses(
          [entity1[model.id], entity2[model.id]],
          [entity1, entity2],
          new AntJsSearchOptions(),
        );

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
        const entity1: EntityTest = { field: 'sample-2', id: 2 };
        const entity2: EntityTest = { field: 'sample-3', id: 3 };
        const unexistingEntity1: EntityTest = { field: 'sample-1', id: 1 };
        const unexistingEntity4: EntityTest = { field: 'sample-4', id: 4 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMisses(
          [entity1[model.id], entity2[model.id]],
          [entity1, entity2],
          new AntJsSearchOptions(),
        );

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

  private _itMustFindNullIfNullIdIsProvided(): void {
    const itsName = 'mustFindNullIfNullIdIsProvided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        expect(await primaryEntityManager.get(null)).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails(): void {
    const itsName = 'mustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const model = new AntModel('id', { prefix });
        const primaryEntityManager = new AntPrimaryEntityManager(model, this._redis.redis, null);
        const idToSearch = 3;

        expect(await primaryEntityManager.get(idToSearch)).toBeUndefined();
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
        const [, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        expect(await primaryEntityManager.mGet(new Array())).toEqual(new Array());
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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMiss(
          entity[model.id],
          entity,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheIfNotExist }),
        );
        const entityFound = await primaryEntityManager.get(entity[model.id]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMiss(
          entity[model.id],
          entity,
          new AntJsSearchOptions({
            cacheMode: CacheMode.CacheIfNotExist,
            ttl: 10000,
          }),
        );

        const entityFound = await primaryEntityManager.get(entity[model.id]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMiss(
          entity[model.id],
          entity,
          new AntJsSearchOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );

        const entityFound = await primaryEntityManager.get(entity[model.id]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix, true);
        primaryEntityManager.cacheMiss(entity.id, null, new AntJsSearchOptions());

        const entityFound = await primaryEntityManager.get(entity[model.id]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMisses(
          [entity[model.id]],
          [entity],
          new AntJsSearchOptions({
            cacheMode: CacheMode.CacheIfNotExist,
          }),
        );

        const entityFound = await primaryEntityManager.mGet([entity[model.id]]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMisses(
          [entity[model.id]],
          [entity],
          new AntJsSearchOptions({
            cacheMode: CacheMode.CacheIfNotExist,
            ttl: 10000,
          }),
        );

        const entityFound = await primaryEntityManager.mGet([entity[model.id]]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        primaryEntityManager.cacheMisses(
          [entity[model.id]],
          [entity],
          new AntJsSearchOptions({
            cacheMode: CacheMode.CacheAndOverwrite,
            ttl: 10000,
          }),
        );

        const entityFound = await primaryEntityManager.mGet([entity[model.id]]);

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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);
        const entityFound = await primaryEntityManager.mGet([entity[model.id]]);

        expect(entityFound).toEqual([undefined]);
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
        const entity: EntityTest = { field: 'sample', id: 0 };
        const entity2: EntityTest = { field: 'sample-2', id: 1 };
        const [model, primaryEntityManager] = this._helperGenerateBaseInstances(prefix);

        await primaryEntityManager.cacheMisses(
          [entity[model.id], entity2[model.id]],
          [entity2],
          new AntJsSearchOptions(),
        );

        const entitiesFound = await primaryEntityManager.mGet([entity[model.id], entity2[model.id]]);

        expect(entitiesFound).toEqual([null, entity2]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
