import * as _ from 'lodash';
import { AntJsModelManagerGenerator } from '../../testapi/api/generator/antjs-model-manager-generator';
import { AntJsSearchOptions } from '../../persistence/options/antjs-search-options';
import { AntJsUpdateOptions } from '../../persistence/options/antjs-update-options';
import { AntModel } from '../../model/ant-model';
import { AntSchedulerModelManager } from '../../persistence/scheduler/ant-scheduler-model-manager';
import { CacheMode } from '../../persistence/options/cache-mode';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { MultipleResultQueryByFieldManager } from '../query/multiple-result-query-by-field-manager';
import { PrimaryEntityManager } from '../../persistence/primary/primary-entity-manager';
import { PrimaryModelManager } from '../../persistence/primary/primary-model-manager';
import { PrimaryQueryManager } from '../../persistence/query/primary-query-manager';
import { RedisWrapper } from './redis-wrapper';
import { SchedulerModelManager } from '../../persistence/scheduler/scheduler-model-manager';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/secondary-entity-manager-mock';
import { SingleResultPrimaryQueryManager } from '../../persistence/query/single-result-primary-query-manager';
import { SingleResultQueryByFieldManager } from '../query/single-result-query-by-field-manager';
import { Test } from '../../testapi/api/test';
import { iterableFilter } from '../util/iterable-filter';
import { iterableFind } from '../util/iterable-find';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

interface EntityTest extends Entity {
  id: number;
  numberField: number;
  strField: string;
}
const modelTestProperties = ['id', 'numberField', 'strField'];
const modelTestGenerator = (prefix: string): AntModel<EntityTest> => new AntModel<EntityTest>('id', { prefix });

const entityByStrFieldParam = <T extends number | string>(
  model: Model<Entity>,
  secondaryEntityManager: SecondaryEntityManagerMock<Entity>,
) => (params: any): Promise<T> => {
  const entity = iterableFind(secondaryEntityManager.store.values(), (entity) => params.strField === entity.strField);
  return Promise.resolve(entity ? entity[model.id] : null);
};

export class ModelManagerTest implements Test {
  /**
   * Before all task performed promise.
   */
  protected _beforeAllPromise: Promise<any>;
  /**
   * Declare name for the test
   */
  protected _declareName: string;
  /**
   * Model manager generator.
   */
  protected _modelManagerGenerator: AntJsModelManagerGenerator;
  /**
   * Redis Wrapper
   */
  protected _redis: RedisWrapper;

  /**
   * Creates a new ModelManagerTest.
   * @param beforeAllPromise Before all promise.
   */
  public constructor(beforeAllPromise: Promise<any>) {
    this._modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
    this._beforeAllPromise = beforeAllPromise;
    this._declareName = 'ModelManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustAddAQuery();
      this._itMustBeInitializable();
      this._itMustDeleteAnEntityUsingNegativeCache();
      this._itMustDeleteAnEntityWithoutUsingNegativeCache();
      this._itMustDeleteMultipleEntitiesUsingNegativeCache();
      this._itMustDeleteMultipleEntitiesWithoutUsingNegativeCache();
      this._itMustDeleteZeroEntities();
      this._itMustGetAnEntity();
      this._itMustGetMultipleEntities();
      this._itMustInvokeEntityToPrimaryOnUpdate();
      this._itMustSyncAMRQWhenDeletingAnEntity();
      this._itMustSyncAMRQWhenDeletingMultipleEntities();
      this._itMustSyncAMRQWhenUpdatingAnEntity();
      this._itMustSyncAMRQWhenUpdatingMultipleEntities();
      this._itMustSyncASRQWhenDeletingAnEntity();
      this._itMustSyncASRQWhenDeletingMultipleEntities();
      this._itMustSyncASRQWhenUpdatingAnEntity();
      this._itMustSyncASRQWhenUpdatingMultipleEntities();
      this._itMustUpdateAnEntityUsingNegativeCache();
      this._itMustUpdateAnEntityWithCacheAndOverwrite();
      this._itMustUpdateAnEntityWithCacheAndOverwriteWithTTL();
      this._itMustUpdateAnEntityWithCacheIfNotExists();
      this._itMustUpdateAnEntityWithCacheIfNotExistsWithTTL();
      this._itMustUpdateAnEntityWithoutUsingNegativeCache();
      this._itMustUpdateMultipleEntitiesUsingNegativeCache();
      this._itMustUpdateMultipleEntitiesWithCacheAndOverwriteAndTTL();
      this._itMustUpdateMultipleEntitiesWithoutUsingNegativeCache();
      this._itMustUpdateZeroEntities();
    });
  }

  /**
   * Helper for searching entities.
   * @param entity Entity to search.
   * @param model Model of the entities.
   * @param primaryEntityManager Primary entity manager.
   * @param queriesMap Queries map.
   * @returns Promise of entities found by the primary and the query managers.
   */
  private async _helperSearchEntity(
    entity: EntityTest,
    model: Model<Entity>,
    primaryEntityManager: PrimaryEntityManager<EntityTest>,
    queriesMap: Map<string, PrimaryQueryManager<EntityTest>>,
  ): Promise<[EntityTest, EntityTest[]]> {
    const searchEntityByPrimaryEntityManager = await primaryEntityManager.get(entity[model.id]);
    const searchEntityByQueryManager = new Array();
    for (const [property, query] of queriesMap) {
      const searchArgs: any = {};
      searchArgs[property] = entity[property];
      const result = await query.get(searchArgs, new AntJsSearchOptions());
      searchEntityByQueryManager.push(result);
    }
    return [searchEntityByPrimaryEntityManager, searchEntityByQueryManager];
  }

  private _itMustAddAQuery(): void {
    const itsName = 'mustAddAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });

        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;

        const singleResultQueryManager = new SingleResultQueryByFieldManager<EntityTest>(
          model,
          schedulerManager,
          entityByStrFieldParam(model, secondaryEntityManager),
          this._redis.redis,
          prefix + 'reverse/strField/',
          'strField',
          prefix + 'query/strField/',
        );

        modelManager.addQuery(singleResultQueryManager);
        await singleResultQueryManager.get(entity1, new AntJsSearchOptions());
        await modelManager.delete(entity1.id);

        const entity1Search = await singleResultQueryManager.get(entity1, new AntJsSearchOptions());
        expect(entity1Search).toBeNull();
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
        try {
          this._modelManagerGenerator.generateModelManager({
            model: modelTestGenerator(prefix),
          });
        } catch {
          fail();
        } finally {
          done();
        }
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustDeleteAnEntityUsingNegativeCache(): void {
    const itsName = 'mustDeleteAnEntityUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });

        await modelManager.cacheMisses([entity1.id, entity2.id], [entity1, entity2], new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        await modelManager.delete(entity1.id);

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toBeNull();
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toBeNull();
        }
        expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toEqual(entity2);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustDeleteAnEntityWithoutUsingNegativeCache(): void {
    const itsName = 'mustDeleteAnEntityWithoutUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);

        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });

        await modelManager.cacheMisses([entity1.id, entity2.id], [entity1, entity2], new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        await modelManager.delete(entity1.id);

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toBeUndefined();
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toBeNull();
        }
        expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toEqual(entity2);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustDeleteMultipleEntitiesUsingNegativeCache(): void {
    const itsName = 'mustDeleteMultipleEntitiesUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity3: EntityTest = {
          id: 2,
          numberField: 3,
          strField: 'c',
        };
        const entities: EntityTest[] = [entity1, entity2, entity3];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMisses(
          [entity1.id, entity2.id, entity3.id],
          [entity1, entity2, entity3],
          new AntJsSearchOptions(),
        );
        await secondaryEntityManager.mDelete([entity1.id, entity2.id]);
        await modelManager.mDelete([entity1.id, entity2.id]);

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity3ByPrimaryEntityManager, searchEntity3ByQueryManager] = await this._helperSearchEntity(
          entity3,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toBeNull();
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toBeNull();
        }
        expect(searchEntity2ByPrimaryEntityManager).toBeNull();
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toBeNull();
        }
        expect(searchEntity3ByPrimaryEntityManager).toEqual(entity3);
        for (const search of searchEntity3ByQueryManager) {
          expect(search).toEqual(entity3);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustDeleteMultipleEntitiesWithoutUsingNegativeCache(): void {
    const itsName = 'mustDeleteMultipleEntitiesWithoutUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity3: EntityTest = {
          id: 2,
          numberField: 3,
          strField: 'c',
        };
        const entities: EntityTest[] = [entity1, entity2, entity3];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMisses(
          [entity1.id, entity2.id, entity3.id],
          [entity1, entity2, entity3],
          new AntJsSearchOptions(),
        );
        await secondaryEntityManager.mDelete([entity1.id, entity2.id]);
        await modelManager.mDelete([entity1.id, entity2.id]);

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity3ByPrimaryEntityManager, searchEntity3ByQueryManager] = await this._helperSearchEntity(
          entity3,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toBeUndefined();
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toBeNull();
        }
        expect(searchEntity2ByPrimaryEntityManager).toBeUndefined();
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toBeNull();
        }
        expect(searchEntity3ByPrimaryEntityManager).toEqual(entity3);
        for (const search of searchEntity3ByQueryManager) {
          expect(search).toEqual(entity3);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustInvokeEntityToPrimaryOnUpdate(): void {
    const itsName = 'mustInvokeEntityToPrimaryOnUpdate';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const fakeInitialEntity: any = {
          carpe: 'diem',
        };
        const model: Model<EntityTest> = {
          entityToPrimary: () => fakeInitialEntity,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: () => [fakeInitialEntity],
          mPrimaryToEntity: (primaries) => primaries,
          primaryToEntity: (primary) => primary,
        };
        const initialEntity: EntityTest = {
          id: 0,
          numberField: 1,
          strField: '2',
        };
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
        });

        // The entity should be written at cache now.
        await modelManager.update(initialEntity, new AntJsUpdateOptions());
        // This should be a cache hit.
        const entityFound = await modelManager.get(initialEntity.id);

        expect(entityFound).toEqual(fakeInitialEntity);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustDeleteZeroEntities(): void {
    const itsName = 'mustDeleteZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entities: EntityTest[] = [entity1];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMiss(entity1[model.id], entity1, new AntJsSearchOptions());
        await modelManager.mDelete(new Array());

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1);
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toEqual(entity1);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAnEntity(): void {
    const itsName = 'mustGetAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const model = modelTestGenerator(prefix);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
        });
        await modelManager.cacheMiss(entity1[model.id], entity1, new AntJsSearchOptions());
        const entityFound = await modelManager.get(entity1[model.id]);
        expect(entityFound).toEqual(entity1);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetMultipleEntities(): void {
    const itsName = 'mustGetMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const model = modelTestGenerator(prefix);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
        });
        await modelManager.cacheMisses(
          [entity1[model.id], entity2[model.id]],
          [entity1, entity2],
          new AntJsSearchOptions(),
        );
        const entityFound = await modelManager.mGet([entity1[model.id], entity2[model.id]]);
        expect(entityFound).toContain(entity1);
        expect(entityFound).toContain(entity2);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncAMRQWhenDeletingAnEntity(): void {
    const itsName = 'mustSyncAMRQWhenDeletingAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'a',
        };
        const entity3: EntityTest = {
          id: 2,
          numberField: 3,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2, entity3];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;

        const query = new MultipleResultQueryByFieldManager(
          model,
          schedulerManager,
          (params: any) =>
            Promise.resolve(
              _.map(
                iterableFilter(secondaryEntityManager.store.values(), (entity) => params.strField === entity.strField),
                (entity) => entity.id,
              ),
            ),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await query.mGet([entity1, entity2, entity3], new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        await modelManager.delete(entity1.id);
        expect(await modelManager.get(entity1.id)).toBeNull();
        expect(await modelManager.get(entity2.id)).toEqual(entity2);
        expect(await modelManager.get(entity3.id)).toEqual(entity3);
        expect(await query.get(entity2, new AntJsSearchOptions())).toEqual([entity2]);
        expect(await query.get(entity3, new AntJsSearchOptions())).toEqual([entity3]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncAMRQWhenDeletingMultipleEntities(): void {
    const itsName = 'mustSyncAMRQWhenDeletingMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'a',
        };
        const entity3: EntityTest = {
          id: 2,
          numberField: 3,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2, entity3];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;

        const query = new MultipleResultQueryByFieldManager(
          model,
          schedulerManager,
          (params: any) =>
            Promise.resolve(
              _.map(
                iterableFilter(secondaryEntityManager.store.values(), (entity) => params.strField === entity.strField),
                (entity) => entity.id,
              ),
            ),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await query.mGet([entity1, entity2, entity3], new AntJsSearchOptions());
        await secondaryEntityManager.mDelete([entity1.id, entity3.id]);
        await modelManager.mDelete([entity1.id, entity3.id]);
        expect(await modelManager.get(entity1.id)).toBeNull();
        expect(await modelManager.get(entity2.id)).toEqual(entity2);
        expect(await modelManager.get(entity3.id)).toBeNull();
        expect(await query.get(entity2, new AntJsSearchOptions())).toEqual([entity2]);
        expect(await query.get(entity3, new AntJsSearchOptions())).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncAMRQWhenUpdatingAnEntity(): void {
    const itsName = 'mustSyncAMRQWhenUpdatingAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 4,
          strField: 'b',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'a',
        };
        const entity3: EntityTest = {
          id: 2,
          numberField: 3,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2, entity3];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;
        const query = new MultipleResultQueryByFieldManager(
          model,
          schedulerManager,
          (params: any) =>
            Promise.resolve(
              _.map(
                iterableFilter(secondaryEntityManager.store.values(), (entity) => params.strField === entity.strField),
                (entity) => entity.id,
              ),
            ),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await query.mGet([entity1, entity2, entity3], new AntJsSearchOptions());
        secondaryEntityManager.store.set(entity1After[model.id], entity1After);
        await modelManager.update(entity1After, new AntJsUpdateOptions());
        const [entity1SearchResult, entity2SearchResult, entity3SearchResult] = await modelManager.mGet([
          entity1After.id,
          entity2.id,
          entity3.id,
        ]);
        const [querySearchByStrAResult, querySearchByStrBResult] = await Promise.all([
          query.get({ strField: 'a' }, new AntJsSearchOptions()),
          query.get({ strField: 'b' }, new AntJsSearchOptions()),
        ]);

        expect(entity1SearchResult).toEqual(entity1After);
        expect(entity2SearchResult).toEqual(entity2);
        expect(entity3SearchResult).toEqual(entity3);
        expect(querySearchByStrAResult).toEqual([entity2]);
        expect(querySearchByStrBResult).toContain(entity1After);
        expect(querySearchByStrBResult).toContain(entity3);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncAMRQWhenUpdatingMultipleEntities(): void {
    const itsName = 'mustSyncAMRQWhenUpdatingMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 4,
          strField: 'b',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'a',
        };
        const entity3: EntityTest = {
          id: 2,
          numberField: 3,
          strField: 'b',
        };
        const entity3After: EntityTest = {
          id: 2,
          numberField: 4,
          strField: 'c',
        };
        const entities: EntityTest[] = [entity1, entity2, entity3];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;
        const query = new MultipleResultQueryByFieldManager(
          model,
          schedulerManager,
          (params: any) =>
            Promise.resolve(
              _.map(
                iterableFilter(secondaryEntityManager.store.values(), (entity) => params.strField === entity.strField),
                (entity) => entity.id,
              ),
            ),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await query.mGet([entity1, entity2, entity3], new AntJsSearchOptions());
        secondaryEntityManager.store.set(entity1After[model.id], entity1After);
        secondaryEntityManager.store.set(entity3After[model.id], entity3After);
        await modelManager.mUpdate([entity1After, entity3After], new AntJsUpdateOptions());
        const [entity1SearchResult, entity2SearchResult, entity3SearchResult] = await modelManager.mGet([
          entity1After.id,
          entity2.id,
          entity3After.id,
        ]);
        const [querySearchByStrAResult, querySearchByStrBResult, querySearchByStrCResult] = await Promise.all([
          query.get({ strField: 'a' }, new AntJsSearchOptions()),
          query.get({ strField: 'b' }, new AntJsSearchOptions()),
          query.get({ strField: 'c' }, new AntJsSearchOptions()),
        ]);

        expect(entity1SearchResult).toEqual(entity1After);
        expect(entity2SearchResult).toEqual(entity2);
        expect(entity3SearchResult).toEqual(entity3After);
        expect(querySearchByStrAResult).toEqual([entity2]);
        expect(querySearchByStrBResult).toEqual([entity1After]);
        expect(querySearchByStrCResult).toEqual([entity3After]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncASRQWhenDeletingAnEntity(): void {
    const itsName = 'mustSyncASRQWhenDeletingAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;
        const query = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          entityByStrFieldParam(model, secondaryEntityManager),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await Promise.all([query.get(entity1, new AntJsSearchOptions()), query.get(entity2, new AntJsSearchOptions())]);
        await secondaryEntityManager.delete(entity1.id);
        await modelManager.delete(entity1.id);
        expect(await modelManager.get(entity1.id)).toBeNull();
        expect(await modelManager.get(entity2.id)).toEqual(entity2);
        expect(await query.get(entity1, new AntJsSearchOptions())).toBeNull();
        expect(await query.get(entity2, new AntJsSearchOptions())).toEqual(entity2);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncASRQWhenDeletingMultipleEntities(): void {
    const itsName = 'mustSyncASRQWhenDeletingMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;
        const query = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          entityByStrFieldParam(model, secondaryEntityManager),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await Promise.all([query.get(entity1, new AntJsSearchOptions()), query.get(entity2, new AntJsSearchOptions())]);
        await secondaryEntityManager.mDelete([entity1.id, entity2.id]);
        await modelManager.mDelete([entity1.id, entity2.id]);
        expect(await modelManager.get(entity1.id)).toBeNull();
        expect(await modelManager.get(entity2.id)).toBeNull();
        expect(await query.get(entity1, new AntJsSearchOptions())).toBeNull();
        expect(await query.get(entity2, new AntJsSearchOptions())).toBeNull();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncASRQWhenUpdatingAnEntity(): void {
    const itsName = 'mustSyncASRQWhenUpdatingAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 3,
          strField: 'c',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;
        const query = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          entityByStrFieldParam(model, secondaryEntityManager),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await Promise.all([query.get(entity1, new AntJsSearchOptions()), query.get(entity2, new AntJsSearchOptions())]);
        secondaryEntityManager.store.set(entity1After[model.id], entity1After);
        await modelManager.update(entity1After, new AntJsUpdateOptions());
        expect(await modelManager.get(entity1After.id)).toEqual(entity1After);
        expect(await modelManager.get(entity2.id)).toEqual(entity2);
        expect(await query.get(entity1, new AntJsSearchOptions())).toBeNull();
        expect(await query.get(entity1After, new AntJsSearchOptions())).toEqual(entity1After);
        expect(await query.get(entity2, new AntJsSearchOptions())).toEqual(entity2);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSyncASRQWhenUpdatingMultipleEntities(): void {
    const itsName = 'mustSyncASRQWhenUpdatingMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 3,
          strField: 'c',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity2After: EntityTest = {
          id: 1,
          numberField: 4,
          strField: 'd',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        const schedulerManager = new AntSchedulerModelManager(
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          secondaryEntityManager,
        ) as SchedulerModelManager<EntityTest>;
        const query = new SingleResultQueryByFieldManager(
          model,
          schedulerManager,
          entityByStrFieldParam(model, secondaryEntityManager),
          this._redis.redis,
          prefix + 'reverse/',
          'strField',
          prefix + 'query/',
        );
        modelManager.addQuery(query);
        await Promise.all([query.get(entity1, new AntJsSearchOptions()), query.get(entity2, new AntJsSearchOptions())]);
        secondaryEntityManager.store.set(entity1After[model.id], entity1After);
        secondaryEntityManager.store.set(entity2After[model.id], entity2After);
        await modelManager.mUpdate([entity1After, entity2After], new AntJsUpdateOptions());
        expect(await modelManager.get(entity1After.id)).toEqual(entity1After);
        expect(await modelManager.get(entity2After.id)).toEqual(entity2After);
        expect(await query.get(entity1, new AntJsSearchOptions())).toBeNull();
        expect(await query.get(entity1After, new AntJsSearchOptions())).toEqual(entity1After);
        expect(await query.get(entity2, new AntJsSearchOptions())).toBeNull();
        expect(await query.get(entity2After, new AntJsSearchOptions())).toEqual(entity2After);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateAnEntityUsingNegativeCache(): void {
    const itsName = 'mustUpdateAnEntityUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 11,
          strField: 'aa',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMisses([entity1.id, entity2.id], [entity1, entity2], new AntJsSearchOptions());
        await modelManager.update(entity1After, new AntJsUpdateOptions());

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1After,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1After);
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toEqual(entity1After);
        }
        expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toEqual(entity2);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateAnEntityWithCacheAndOverwrite(): void {
    const itsName = 'mustUpdateAnEntityWithCacheAndOverwrite';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };

        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1]);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.update(entity1, new AntJsUpdateOptions({ cacheMode: CacheMode.CacheAndOverwrite }));

        expect(await modelManager.get(entity1[model.id])).toEqual(entity1);

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateAnEntityWithCacheAndOverwriteWithTTL(): void {
    const itsName = 'mustUpdateAnEntityWithCacheAndOverwriteWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };

        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1]);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.update(
          entity1,
          new AntJsUpdateOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );

        expect(await modelManager.get(entity1[model.id])).toEqual(entity1);

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateAnEntityWithCacheIfNotExists(): void {
    const itsName = 'mustUpdateAnEntityWithCacheIfNotExists';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };

        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity2After: EntityTest = {
          id: 1,
          numberField: 3,
          strField: 'bAfter',
        };

        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1, entity2]);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.update(entity1, new AntJsUpdateOptions({ cacheMode: CacheMode.CacheIfNotExist }));
        await modelManager.update(entity2, new AntJsUpdateOptions({ cacheMode: CacheMode.CacheIfNotExist }));
        await modelManager.update(entity2After, new AntJsUpdateOptions({ cacheMode: CacheMode.CacheIfNotExist }));

        expect(await modelManager.get(entity1[model.id])).toEqual(entity1);
        expect(await modelManager.get(entity2[model.id])).toEqual(entity2);

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateAnEntityWithCacheIfNotExistsWithTTL(): void {
    const itsName = 'mustUpdateAnEntityWithCacheIfNotExistsWithTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };

        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity2After: EntityTest = {
          id: 1,
          numberField: 3,
          strField: 'bAfter',
        };

        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1, entity2]);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.update(
          entity1,
          new AntJsUpdateOptions({ cacheMode: CacheMode.CacheIfNotExist, ttl: 10000 }),
        );
        await modelManager.update(
          entity2,
          new AntJsUpdateOptions({ cacheMode: CacheMode.CacheIfNotExist, ttl: 10000 }),
        );
        await modelManager.update(
          entity2After,
          new AntJsUpdateOptions({ cacheMode: CacheMode.CacheIfNotExist, ttl: 10000 }),
        );

        expect(await modelManager.get(entity1[model.id])).toEqual(entity1);
        expect(await modelManager.get(entity2[model.id])).toEqual(entity2);

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateAnEntityWithoutUsingNegativeCache(): void {
    const itsName = 'mustUpdateAnEntityWithoutUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 11,
          strField: 'aa',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMisses([entity1.id, entity2.id], [entity1, entity2], new AntJsSearchOptions());
        await modelManager.update(entity1After, new AntJsUpdateOptions());

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1After,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1After);
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toEqual(entity1After);
        }
        expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toEqual(entity2);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateMultipleEntitiesUsingNegativeCache(): void {
    const itsName = 'mustUpdateMultipleEntitiesUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 11,
          strField: 'aa',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMisses([entity1.id, entity2.id], [entity1, entity2], new AntJsSearchOptions());
        await modelManager.mUpdate([entity1After], new AntJsUpdateOptions());

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1After,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1After);
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toEqual(entity1After);
        }
        expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toEqual(entity2);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateMultipleEntitiesWithCacheAndOverwriteAndTTL(): void {
    const itsName = 'mustUpdateMultipleEntitiesWithCacheAndOverwriteAndTTL';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };

        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, [entity1]);
        const [modelManager] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.mUpdate(
          [entity1],
          new AntJsUpdateOptions({ cacheMode: CacheMode.CacheAndOverwrite, ttl: 10000 }),
        );

        expect(await modelManager.get(entity1[model.id])).toEqual(entity1);

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateMultipleEntitiesWithoutUsingNegativeCache(): void {
    const itsName = 'mustUpdateMultipleEntitiesWithoutUsingNegativeCache';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };
        const entity1After: EntityTest = {
          id: 0,
          numberField: 11,
          strField: 'aa',
        };
        const entities: EntityTest[] = [entity1, entity2];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: false,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMisses(
          [entity1[model.id], entity2[model.id]],
          [entity1, entity2],
          new AntJsSearchOptions(),
        );
        await modelManager.mUpdate([entity1After], new AntJsUpdateOptions());

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await this._helperSearchEntity(
          entity1After,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );
        const [searchEntity2ByPrimaryEntityManager, searchEntity2ByQueryManager] = await this._helperSearchEntity(
          entity2,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1After);
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toEqual(entity1After);
        }
        expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
        for (const search of searchEntity2ByQueryManager) {
          expect(search).toEqual(entity2);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustUpdateZeroEntities(): void {
    const itsName = 'mustUpdateZeroEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entities: EntityTest[] = [entity1];
        const model = modelTestGenerator(prefix);
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [modelManager, , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager({
          model,
          redisOptions: {
            singleResultQueryManagersOptions: {
              properties: modelTestProperties,
              queryPrefix: prefix + 'query/',
              reverseHashKey: prefix + 'reverse/',
            },
            useEntityNegativeCache: true,
          },
          secondaryOptions: {
            manager: secondaryEntityManager,
          },
        });
        await modelManager.cacheMiss(entity1[model.id], entity1, new AntJsSearchOptions());
        await modelManager.mUpdate(new Array(), new AntJsUpdateOptions());

        const [searchEntity1ByPrimaryEntityManager, searchEntity1ByQueryManager] = await await this._helperSearchEntity(
          entity1,
          model,
          modelManager as PrimaryModelManager<EntityTest>,
          queryManagersByProperty as Map<string, SingleResultPrimaryQueryManager<EntityTest>>,
        );

        expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1);
        for (const search of searchEntity1ByQueryManager) {
          expect(search).toEqual(entity1);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
