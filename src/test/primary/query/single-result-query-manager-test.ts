import { AntJsSearchOptions } from '../../../persistence/options/antjs-search-options';
import { AntModel } from '../../../model/ant-model';
import { AntPrimaryModelManager } from '../../../persistence/primary/ant-primary-model-manager';
import { AntSchedulerModelManager } from '../../../persistence/scheduler/ant-scheduler-model-manager';
import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { PrimaryModelManager } from '../../../persistence/primary/primary-model-manager';
import { RedisWrapper } from '../redis-wrapper';
import { SchedulerModelManager } from '../../../persistence/scheduler/scheduler-model-manager';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';
import { SecondaryEntityManagerMock } from '../../../testapi/api/secondary/secondary-entity-manager-mock';
import { SingleResultQueryByFieldManager } from './single-result-query-by-field-manager';
import { Test } from '../../../testapi/api/test';
import { iterableFind } from '../../util/iterable-find';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

type EntityTestStr = Entity & {
  id: number;
  field: string;
};

const entityByFieldParam = <T extends number | string>(
  model: Model<Entity>,
  secondaryEntityManager: SecondaryEntityManagerMock<Entity>,
) => (params: any): Promise<T> => {
  const entity = iterableFind(secondaryEntityManager.store.values(), (entity) => params.field === entity.field);
  return Promise.resolve(entity ? entity[model.id] : null);
};

export class SingleResultQueryManagerTest implements Test {
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
    this._declareName = 'SingleResultQueryManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustIgnorePrimaryAndSecondaryLayerIfIgnoreFlagIsUpAtGetMethod();
      this._itMustIgnorePrimaryAndSecondaryLayerIfIgnoreFlagIsUpAtMGetMethod();
      this._itMustIgnorePrimaryLayerIfIgnoreFlagIsUpAtGetMethod();
      this._itMustIgnorePrimaryLayerIfIgnoreFlagIsUpAtMGetMethod();
      this._itMustInvokePrimaryToEntityAtGetOnQueryCacheHit();
      this._itMustPerformACachedSearchWithCachedEntities();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this._itMustPerformACustomMultipleResultSearch();
      this._itMustPerformAMultipleCachedSearchWithCachedEntities();
      this._itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this._itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString();
      this._itMustPerformAMultipleUncachedSearch();
      this._itMustPerformAMultipleUnexistingCachedSearch();
      this._itMustPerformAMultipleUnexistingUncachedSearch();
      this._itMustPerformAMultipleZeroSearch();
      this._itMustPerformAnUncachedSearch();
      this._itMustPerformAnUnexistingCachedSearch();
      this._itMustPerformAnUnexistingUncachedSearch();
      this._itMustProcessANegativeCachedEntity();
    });
  }

  /**
   * Generates instances needed in almost every test.
   * @param prefix prefix to generate redis keys.
   * @returns model, primary entity manager and secondary entity manager instanes.
   */
  private _helperGenerateBaseInstances(
    prefix: string,
    entities: EntityTestStr[],
  ): [Model<EntityTestStr>, SchedulerModelManager<EntityTestStr>, SecondaryEntityManagerMock<EntityTestStr>] {
    const model = new AntModel<EntityTestStr>('id', { prefix });
    const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTestStr>(model, entities);
    const primaryManager = new AntPrimaryModelManager(model, this._redis.redis, true);
    const schedulerManager = new AntSchedulerModelManager<
      EntityTestStr,
      Model<EntityTestStr>,
      PrimaryModelManager<EntityTestStr>,
      SecondaryEntityManager<EntityTestStr>
    >(model, primaryManager, secondaryEntityManager);
    return [model, schedulerManager, secondaryEntityManager];
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [model, manager] = this._helperGenerateBaseInstances(prefix, new Array());
        expect(() => {
          new SingleResultQueryByFieldManager(
            model,
            manager,
            () => null,
            this._redis.redis,
            prefix + 'reverse/',
            'field',
            prefix + 'query-by-field/',
          );
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustIgnorePrimaryAndSecondaryLayerIfIgnoreFlagIsUpAtGetMethod(): void {
    const itsName = 'mustIgnorePrimaryAndSecondaryLayerIfIgnoreFlagIsUpAtGetMethod';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        const entityFound = await queryManager.get(
          { field: entity1.field },
          new AntJsSearchOptions({ ignorePrimaryLayer: true, ignoreSecondaryLayer: true }),
        );
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustIgnorePrimaryAndSecondaryLayerIfIgnoreFlagIsUpAtMGetMethod(): void {
    const itsName = 'mustIgnorePrimaryAndSecondaryLayerIfIgnoreFlagIsUpAtMGetMethod';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        const entityFound = await queryManager.mGet(
          [{ field: entity1.field }],
          new AntJsSearchOptions({ ignorePrimaryLayer: true, ignoreSecondaryLayer: true }),
        );
        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustIgnorePrimaryLayerIfIgnoreFlagIsUpAtGetMethod(): void {
    const itsName = 'mustIgnorePrimaryLayerIfIgnoreFlagIsUpAtGetMethod';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        const entityFound = await queryManager.get(
          { field: entity1.field },
          new AntJsSearchOptions({ ignorePrimaryLayer: true }),
        );
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustIgnorePrimaryLayerIfIgnoreFlagIsUpAtMGetMethod(): void {
    const itsName = 'mustIgnorePrimaryLayerIfIgnoreFlagIsUpAtMGetMethod';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        const entityFound = await queryManager.mGet(
          [{ field: entity1.field }],
          new AntJsSearchOptions({ ignorePrimaryLayer: true }),
        );
        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustInvokePrimaryToEntityAtGetOnQueryCacheHit(): void {
    const itsName = 'mustInvokePrimaryToEntityAtGetOnQueryCacheHit';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const fakeInitialEntity: EntityTestStr = ({
          putYourFaith: 'in the light',
        } as unknown) as EntityTestStr;

        const model: Model<EntityTestStr> = {
          entityToPrimary: (entity) => entity,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: (entities) => entities,
          mPrimaryToEntity: () => [fakeInitialEntity],
          primaryToEntity: () => fakeInitialEntity,
        };
        const initialEntity: EntityTestStr = {
          field: 'sample-field',
          id: 0,
        };
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTestStr>(model, [initialEntity]);
        const primaryManager = new AntPrimaryModelManager(model, this._redis.redis, true);
        const schedulerManager = new AntSchedulerModelManager<
          EntityTestStr,
          Model<EntityTestStr>,
          PrimaryModelManager<EntityTestStr>,
          SecondaryEntityManagerMock<EntityTestStr>
        >(model, primaryManager, secondaryEntityManager);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );

        // A cache miss should happen
        await queryManager.get({ field: initialEntity.field }, new AntJsSearchOptions());
        // A cache hit should happen.
        const entityFound = await queryManager.get({ field: initialEntity.field }, new AntJsSearchOptions());
        expect(entityFound).toEqual(fakeInitialEntity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toEqual(entity1);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, false);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        await modelManager.delete(entity1.id);
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toEqual(entity1);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        type EntityTest = Entity & {
          id: string;
          field: string;
        };
        const model = new AntModel<EntityTest>('id', { prefix });
        const entity1: EntityTest = { field: 'sample-1', id: '1' };
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, false);
        const schedulerManager = new AntSchedulerModelManager<
          EntityTest,
          Model<EntityTest>,
          PrimaryModelManager<EntityTest>,
          SecondaryEntityManagerMock<EntityTest>
        >(model, modelManager, secondaryEntityManager);

        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        await modelManager.delete(entity1.id);
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toEqual(entity1);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformACustomMultipleResultSearch(): void {
    const itsName = 'mustPerformACustomMultipleResultSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const entity2: EntityTestStr = { field: 'sample-2', id: 2 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
          entity2,
        ]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const mQuery = async (paramsArray: any[]): Promise<number[]> => {
          const results = new Array<number>(paramsArray.length);
          const resultsMap = new Map<string, number>();
          for (let i = 0; i < paramsArray.length; ++i) {
            results[i] = null;
            resultsMap.set(paramsArray[i].field, i);
          }
          for (const entity of secondaryEntityManager.store.values()) {
            const index = resultsMap.get(entity.field);
            if (null != index) {
              results[index] = entity.id;
            }
          }
          return results;
        };
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
          mQuery,
        );
        const entitiesFound = await queryManager.mGet(
          [{ field: entity1.field }, { field: entity2.field }],
          new AntJsSearchOptions(),
        );
        expect(entitiesFound).toContain(entity1);
        expect(entitiesFound).toContain(entity2);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleCachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        const entityFound = await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        expect(entityFound).toEqual([entity1]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, false);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        await modelManager.delete(entity1.id);
        const entitiesFound = await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        expect(entitiesFound).toEqual([entity1]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        type EntityTest = Entity & {
          id: string;
          field: string;
        };
        const model = new AntModel<EntityTest>('id', { prefix });
        const entity1: EntityTest = { field: 'sample-1', id: '1' };
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, false);

        const schedulerManager = new AntSchedulerModelManager<
          EntityTest,
          Model<EntityTest>,
          PrimaryModelManager<EntityTest>,
          SecondaryEntityManager<EntityTest>
        >(model, modelManager, secondaryEntityManager);

        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        await modelManager.delete(entity1.id);
        const entityFound = await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        expect(entityFound).toEqual([entity1]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleUncachedSearch(): void {
    const itsName = 'mustPerformAMultipleUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const entity2: EntityTestStr = { field: 'sample-2', id: 2 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
          entity2,
        ]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        const entitiesFound = await queryManager.mGet(
          [{ field: entity1.field }, { field: entity2.field }],
          new AntJsSearchOptions(),
        );
        expect(entitiesFound).toContain(entity1);
        expect(entitiesFound).toContain(entity2);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAMultipleUnexistingCacheSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        const entityFound = await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleUnexistingUncachedSearch(): void {
    const itsName = 'mustPerformAMultipleUnexistingUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        const entityFound = await queryManager.mGet([{ field: entity1.field }], new AntJsSearchOptions());
        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAMultipleZeroSearch(): void {
    const itsName = 'mustPerformAMultipleZeroSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        const entityFound = await queryManager.mGet(new Array(), new AntJsSearchOptions());
        expect(entityFound).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUncachedSearch(): void {
    const itsName = 'mustPerformAnUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toEqual(entity1);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingCachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUnexistingUncachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustProcessANegativeCachedEntity(): void {
    const itsName = 'mustProcessANegativeCachedEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTestStr = { field: 'sample-1', id: 1 };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, true);
        modelManager.delete(entity1[model.id]);
        const query = entityByFieldParam(model, secondaryEntityManager);
        const queryManager = new SingleResultQueryByFieldManager(
          model,
          primaryManager,
          query,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
        const entityFound = await queryManager.get({ field: entity1.field }, new AntJsSearchOptions());
        expect(entityFound).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
