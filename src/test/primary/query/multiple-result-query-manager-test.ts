import { NamedEntity, NamesStartingByLetter } from './names-starting-by-letter';
import { NamedEntityAlternative, NamesStartingByLetterAlternative } from './names-starting-by-letter-alternative';
import { AntJsDeleteOptions } from '../../../persistence/primary/options/antjs-delete-options';
import { AntJsSearchOptions } from '../../../persistence/primary/options/antjs-search-options';
import { AntModel } from '../../../model/ant-model';
import { AntPrimaryModelManager } from '../../../persistence/primary/ant-primary-model-manager';
import { Model } from '../../../model/model';
import { PrimaryModelManager } from '../../../persistence/primary/primary-model-manager';
import { RedisWrapper } from '../redis-wrapper';
import { SecondaryEntityManagerMock } from '../../../testapi/api/secondary/secondary-entity-manager-mock';
import { Test } from '../../../testapi/api/test';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class MultipleResultQueryManagerTest implements Test {
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
    this._declareName = 'MultipleResultQueryManagerTest';
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
      this._itMustPerformACachedSearchWithLotsOfCachedEntities();
      this._itMustPerformACachedSearchWithLotsOfCachedAndUncachedEntities();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this._itMustPerformAMultipleCachedSearchWithCachedEntities();
      this._itMustPerformAnUncachedMultipleEntitiesSearch();
      this._itMustPerformAnUncachedZeroEntitiesSearch();
      this._itMustPerformAnUncachedSearch();
      this._itMustPerformAnUncachedSearchWithLotsOfResults();
      this._itMustPerformAnUnexistingCachedSearch();
      this._itMustPerformAnUnexistingMultipleCachedSearch();
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
    entities: NamedEntity[],
  ): [Model<NamedEntity>, PrimaryModelManager<NamedEntity>, SecondaryEntityManagerMock<NamedEntity>] {
    const model = new AntModel<NamedEntity>('id', { prefix });
    const secondaryEntityManager = new SecondaryEntityManagerMock<NamedEntity>(model, entities);
    const primaryManager = new AntPrimaryModelManager(model, this._redis.redis, true, secondaryEntityManager);
    return [model, primaryManager, secondaryEntityManager];
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        expect(() => {
          new NamesStartingByLetter(
            model,
            primaryManager,
            secondaryEntityManager,
            this._redis.redis,
            prefix + 'reverse/',
            prefix + 'names-starting-with/',
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
        const entity1: NamedEntity = {
          id: 0,
          name: 'sample-name', };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ name: entity1.name }, new AntJsSearchOptions());
        const entityFound = await queryManager.get(
          { name: entity1.name },
          new AntJsSearchOptions({ ignorePrimaryLayer: true, ignoreSecondaryLayer: true }),
        );
        expect(entityFound).toEqual(new Array());
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
        const entity1: NamedEntity = {
          id: 0,
          name: 'sample-name', };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ name: entity1.name }, new AntJsSearchOptions());
        const entityFound = await queryManager.mGet(
          [{ name: entity1.name }],
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
        const entity1: NamedEntity = {
          id: 0,
          name: 'sample-name', };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ name: entity1.name }, new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        const entityFound = await queryManager.get(
          { name: entity1.name },
          new AntJsSearchOptions({ ignorePrimaryLayer: true }),
        );
        expect(entityFound).toEqual(new Array());
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
        const entity1: NamedEntity = {
          id: 0,
          name: 'sample-name', };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'query-by-field/',
        );
        await queryManager.get({ name: entity1.name }, new AntJsSearchOptions());
        await secondaryEntityManager.delete(entity1.id);
        const entityFound = await queryManager.mGet(
          [{ name: entity1.name }],
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
        const fakeInitialEntity: NamedEntity = ({
          goBig: 'or go home',
        } as unknown) as NamedEntity;
        const model: Model<NamedEntity> = {
          entityToPrimary: (entity) => entity,
          id: 'id',
          keyGen: { prefix },
          mEntityToPrimary: (entities) => entities,
          mPrimaryToEntity: () => [fakeInitialEntity],
          primaryToEntity: () => fakeInitialEntity,
        };
        const initialEntity: NamedEntity = {
          id: 0,
          name: 'sample-name',
        };
        const secondaryEntityManager = new SecondaryEntityManagerMock<NamedEntity>(model, [initialEntity]);
        const primaryManager = new AntPrimaryModelManager(model, this._redis.redis, true, secondaryEntityManager);
        const entitiesStartingWithLetterQuery = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        // A cache miss should happen
        await entitiesStartingWithLetterQuery.get(initialEntity, new AntJsSearchOptions());
        // A cache hit should happen.
        const [entityFound] = await entitiesStartingWithLetterQuery.get(initialEntity, new AntJsSearchOptions());
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
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity, new AntJsSearchOptions());
        expect(await queryManager.get(entity, new AntJsSearchOptions())).toEqual([entity]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformACachedSearchWithLotsOfCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithLotsOfCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entitiesSize = 10000;
        const entities = new Array<NamedEntity>();
        const entitiesMap = new Map<number, NamedEntity>();
        for (let i = 0; i < entitiesSize; ++i) {
          const entity = { id: i, name: 'Pepe' + i };
          entities.push(entity);
          entitiesMap.set(entity.id, entity);
        }
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, entities);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const searchParams = { name: 'P' };
        await queryManager.get(searchParams, new AntJsSearchOptions());
        const results = await queryManager.get(searchParams, new AntJsSearchOptions());
        expect(results.length).toBe(entities.length);
        for (const result of results) {
          expect(entitiesMap.get(result.id)).toEqual(result);
        }
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformACachedSearchWithLotsOfCachedAndUncachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithLotsOfCachedAndUncachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entitiesSize = 10000;
        const entities = new Array<NamedEntity>();
        const entitiesMap = new Map<number, NamedEntity>();
        for (let i = 0; i < entitiesSize; ++i) {
          const entity = { id: i, name: 'Pepe' + i };
          entities.push(entity);
          entitiesMap.set(entity.id, entity);
        }
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, entities);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const searchParams = { name: 'P' };
        await queryManager.get(searchParams, new AntJsSearchOptions());
        const results = await queryManager.get(searchParams, new AntJsSearchOptions());
        expect(results.length).toBe(entities.length);
        for (const result of results) {
          expect(entitiesMap.get(result.id)).toEqual(result);
        }
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
        const entity1: NamedEntity = { id: 1, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, false, secondaryEntityManager);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity1, new AntJsSearchOptions());
        await modelManager.delete(entity1.id, new AntJsDeleteOptions());
        const entityFound = await queryManager.get(entity1, new AntJsSearchOptions());
        expect(entityFound).toEqual([entity1]);
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
        const model = new AntModel<NamedEntityAlternative>('id', { prefix });
        const entity1: NamedEntityAlternative = { id: '1', name: 'Pepe' };
        const secondaryEntityManager = new SecondaryEntityManagerMock<NamedEntityAlternative>(model, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, false, secondaryEntityManager);
        const primaryManager = new AntPrimaryModelManager(model, this._redis.redis, true, secondaryEntityManager);
        const queryManager = new NamesStartingByLetterAlternative(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity1, new AntJsSearchOptions());
        await modelManager.delete(entity1.id, new AntJsDeleteOptions());
        const entityFound = await queryManager.get(entity1, new AntJsSearchOptions());
        expect(entityFound).toEqual([entity1]);
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
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.mGet([entity], new AntJsSearchOptions());
        expect(await queryManager.mGet([entity], new AntJsSearchOptions())).toEqual([entity]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUncachedMultipleEntitiesSearch(): void {
    const itsName = 'mustPerformAnUncachedMultipleEntitiesSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: NamedEntity = { id: 0, name: 'Pepe' };
        const entity2: NamedEntity = { id: 1, name: 'Juan' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
          entity2,
        ]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const results = await queryManager.mGet([entity1, entity2], new AntJsSearchOptions());
        expect(results).toContain(entity1);
        expect(results).toContain(entity2);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUncachedZeroEntitiesSearch(): void {
    const itsName = 'mustPerformAnUncachedZeroEntitiesSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity1: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const results = await queryManager.mGet(new Array(), new AntJsSearchOptions());
        expect(results).toEqual(new Array());
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
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        expect(await queryManager.get(entity, new AntJsSearchOptions())).toEqual([entity]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUncachedSearchWithLotsOfResults(): void {
    const itsName = 'mustPerformAnUncachedSearchWithLotsOfResults';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entitiesSize = 10000;
        const entities = new Array<NamedEntity>();
        for (let i = 0; i < entitiesSize; ++i) {
          entities.push({ id: i, name: 'Pepe' + i });
        }
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, entities);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        expect(await queryManager.get({ name: 'P' }, new AntJsSearchOptions())).toEqual(entities);
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
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity, new AntJsSearchOptions());
        expect(await queryManager.get(entity, new AntJsSearchOptions())).toEqual(new Array());
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustPerformAnUnexistingMultipleCachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingMultipleCachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.mGet([entity], new AntJsSearchOptions());
        expect(await queryManager.mGet([entity], new AntJsSearchOptions())).toEqual(new Array());
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
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        expect(await queryManager.get(entity, new AntJsSearchOptions())).toEqual(new Array());
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
        done();
        const entity1: NamedEntity = { id: 0, name: 'Pepe' };
        const [model, primaryManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const modelManager = new AntPrimaryModelManager(model, this._redis.redis, true, secondaryEntityManager);
        const queryManager = new NamesStartingByLetter(
          model,
          primaryManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        modelManager.delete(entity1[model.id], new AntJsDeleteOptions());
        const entityFound = await queryManager.get({ name: entity1.name }, new AntJsSearchOptions());
        expect(entityFound).toEqual(new Array());
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
