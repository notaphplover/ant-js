import { Model } from '../../model/Model';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ITest } from '../ITest';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import {
  NamedEntity,
  NamesStartingByLetter,
} from './NamesStartingByLetter';
import {
  NamedEntityAlternative,
  NamesStartingByLetterAlternative,
} from './NamesStartingByLetterAlternative';
import { RedisWrapper } from './RedisWrapper';

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
    this._declareName = 'MultipleResultQueyManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustDeleteAnEntityInAQuery();
      this._itMustDeleteMultipleEntitiesInQueries();
      this._itMustDeleteZeroEntitiesInQueries();
      this._itMustPerformACachedSearchWithCachedEntities();
      this._itMustPerformACachedSearchWithLotsOfCachedEntities();
      this._itMustPerformACachedSearchWithLotsOfCachedAndUncachedEntities();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this._itMustPerformAnUncachedSearch();
      this._itMustPerformAnUncachedSearchWithLotsOfResults();
      this._itMustPerformAnUnexistingCachedSearch();
      this._itMustPerformAnUnexistingUncachedSearch();
      this._itMustUpdateAnEntityInAQuery();
      this._itMustUpdateMultipleEntitiesInQueries();
      this._itMustUpdateZeroEntitiesInQueries();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new NamesStartingByLetter(
          primaryEntityManager,
          secondaryModelManager,
          this._redis.redis,
          prefix + 'reverse/',
          prefix + 'names-starting-with/',
        );
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteAnEntityInAQuery(): void {
    const itsName = 'mustDeleteAnEntityInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      await queryManager.syncDelete(entity);
      expect(await queryManager.get(entity)).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteMultipleEntitiesInQueries(): void {
    const itsName = 'mustDeleteMultipleEntitiesInQueries';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      await queryManager.syncMDelete([entity]);
      expect(await queryManager.get(entity)).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteZeroEntitiesInQueries(): void {
    const itsName = 'mustDeleteZeroEntitiesInQueries';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      await queryManager.syncMDelete(new Array());
      expect(await queryManager.get(entity)).toEqual([entity]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      expect(await queryManager.get(entity)).toEqual([entity]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithLotsOfCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithLotsOfCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entitiesSize = 10000;
      const entities = new Array<NamedEntity>();
      const entitiesMap = new Map<number, NamedEntity>();
      for (let i = 0; i < entitiesSize; ++i) {
        const entity = {id: i, name: 'Pepe' + i};
        entities.push(entity);
        entitiesMap.set(entity.id, entity);
      }
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, entities);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      const searchParams = {name: 'P'};
      await queryManager.get(searchParams);
      const results = await queryManager.get(searchParams);
      expect(results.length).toBe(entities.length);
      for (const result of results) {
        expect(entitiesMap.get(result.id)).toEqual(result);
      }
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithLotsOfCachedAndUncachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithLotsOfCachedAndUncachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entitiesSize = 10000;
      const entities = new Array<NamedEntity>();
      const entitiesMap = new Map<number, NamedEntity>();
      for (let i = 0; i < entitiesSize; ++i) {
        const entity = {id: i, name: 'Pepe' + i};
        entities.push(entity);
        entitiesMap.set(entity.id, entity);
      }
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, entities);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      const searchParams = {name: 'P'};
      await queryManager.get(searchParams);
      const results = await queryManager.get(searchParams);
      for (let i = 0; i < entitiesSize / 2; ++i) {
        primaryEntityManager.delete(entitiesMap.get(i));
      }
      expect(results.length).toBe(entities.length);
      for (const result of results) {
        expect(entitiesMap.get(result.id)).toEqual(result);
      }
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity1: NamedEntity = {id: 1, name: 'Pepe'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity1);
      await primaryEntityManager.delete(entity1);
      const entityFound = await queryManager.get(entity1);
      expect(entityFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity1: NamedEntityAlternative = {id: '1', name: 'Pepe'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntityAlternative>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetterAlternative(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity1);
      await primaryEntityManager.delete(entity1);
      const entityFound = await queryManager.get(entity1);
      expect(entityFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAnUncachedSearch(): void {
    const itsName = 'mustPerformAnUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      expect(await queryManager.get(entity)).toEqual([entity]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAnUncachedSearchWithLotsOfResults(): void {
    const itsName = 'mustPerformAnUncachedSearchWithLotsOfResults';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entitiesSize = 10000;
      const entities = new Array<NamedEntity>();
      for (let i = 0; i < entitiesSize; ++i) {
        entities.push({id: i, name: 'Pepe' + i});
      }
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, entities);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      expect(await queryManager.get({name: 'P'})).toEqual(entities);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAnUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingCachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, new Array());
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      expect(await queryManager.get(entity)).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAnUnexistingUncachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, new Array());
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      expect(await queryManager.get(entity)).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustUpdateAnEntityInAQuery(): void {
    const itsName = 'mustUpdateAnEntityInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const entityAfter: NamedEntity = { id: 0, name: 'Paco' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      primaryEntityManager.update(entityAfter);
      await queryManager.syncUpdate(entityAfter);
      expect(await queryManager.get(entityAfter)).toEqual([entityAfter]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustUpdateMultipleEntitiesInQueries(): void {
    const itsName = 'mustUpdateMultipleEntitiesInQueries';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const entityAfter: NamedEntity = { id: 0, name: 'Paco' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      primaryEntityManager.mUpdate([entityAfter]);
      await queryManager.syncMUpdate([entityAfter]);
      expect(await queryManager.get(entityAfter)).toEqual([entityAfter]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustUpdateZeroEntitiesInQueries(): void {
    const itsName = 'mustUpdateZeroEntitiesInQueries';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<NamedEntity>(model, [entity]);
      const primaryEntityManager = new PrimaryEntityManager<NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryEntityManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      await queryManager.syncMUpdate([]);
      expect(await queryManager.get(entity)).toEqual([entity]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
