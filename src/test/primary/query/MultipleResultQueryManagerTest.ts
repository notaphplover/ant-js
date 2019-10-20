import { AntModel } from '../../../model/ant-model';
import { Model } from '../../../model/model';
import { IPrimaryEntityManager } from '../../../persistence/primary/IPrimaryEntityManager';
import { ModelManager } from '../../../persistence/primary/ModelManager';
import { PrimaryEntityManager } from '../../../persistence/primary/PrimaryEntityManager';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';
import { ITest } from '../../../testapi/api/ITest';
import { SecondaryEntityManagerMock } from '../../../testapi/api/secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from '../RedisWrapper';
import { NamedEntity, NamesStartingByLetter } from './NamesStartingByLetter';
import { NamedEntityAlternative, NamesStartingByLetterAlternative } from './NamesStartingByLetterAlternative';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class MultipleResultQueryManagerTest implements ITest {
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
  ): [Model, IPrimaryEntityManager<NamedEntity>, SecondaryEntityManagerMock<NamedEntity>] {
    const model = new AntModel('id', { prefix: prefix });
    const secondaryEntityManager = new SecondaryEntityManagerMock<NamedEntity>(model, entities);
    const primaryEntityManager = new PrimaryEntityManager<NamedEntity, ISecondaryEntityManager<NamedEntity>>(
      model,
      this._redis.redis,
      true,
      secondaryEntityManager,
    );
    return [model, primaryEntityManager, secondaryEntityManager];
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        expect(() => {
          // tslint:disable-next-line:no-unused-expression
          new NamesStartingByLetter(
            primaryEntityManager,
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

  private _itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;
        const entity: NamedEntity = { id: 0, name: 'Pepe' };
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity);
        expect(await queryManager.get(entity)).toEqual([entity]);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, entities);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const searchParams = { name: 'P' };
        await queryManager.get(searchParams);
        const results = await queryManager.get(searchParams);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, entities);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const searchParams = { name: 'P' };
        await queryManager.get(searchParams);
        const results = await queryManager.get(searchParams);
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
        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
        ]);
        const modelManager = new ModelManager(model, this._redis.redis, false, secondaryEntityManager);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity1);
        await modelManager.delete(entity1.id);
        const entityFound = await queryManager.get(entity1);
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
        const model = new AntModel('id', { prefix: prefix });
        const entity1: NamedEntityAlternative = { id: '1', name: 'Pepe' };
        const secondaryEntityManager = new SecondaryEntityManagerMock<NamedEntityAlternative>(model, [entity1]);
        const primaryEntityManager = new PrimaryEntityManager<
          NamedEntityAlternative,
          ISecondaryEntityManager<NamedEntityAlternative>
        >(model, this._redis.redis, true, secondaryEntityManager);
        const modelManager = new ModelManager(model, this._redis.redis, false, secondaryEntityManager);
        const queryManager = new NamesStartingByLetterAlternative(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity1);
        await modelManager.delete(entity1.id);
        const entityFound = await queryManager.get(entity1);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.mGet([entity]);
        expect(await queryManager.mGet([entity])).toEqual([entity]);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
          entity2,
        ]);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const results = await queryManager.mGet([entity1, entity2]);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity1]);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        const results = await queryManager.mGet(new Array());
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [entity]);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        expect(await queryManager.get(entity)).toEqual([entity]);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, entities);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        expect(await queryManager.get({ name: 'P' })).toEqual(entities);
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.get(entity);
        expect(await queryManager.get(entity)).toEqual(new Array());
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        await queryManager.mGet([entity]);
        expect(await queryManager.mGet([entity])).toEqual(new Array());
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
        const [, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, new Array());
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        expect(await queryManager.get(entity)).toEqual(new Array());
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
        const [model, primaryEntityManager, secondaryEntityManager] = this._helperGenerateBaseInstances(prefix, [
          entity1,
        ]);
        const modelManager = new ModelManager(model, this._redis.redis, true, secondaryEntityManager);
        const queryManager = new NamesStartingByLetter(
          primaryEntityManager,
          secondaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
        modelManager.delete(entity1[model.id]);
        const entityFound = await queryManager.get({ name: entity1.name });
        expect(entityFound).toEqual(new Array());
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
