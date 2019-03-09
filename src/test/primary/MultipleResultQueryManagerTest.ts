import { IEntity } from '../../model/IEntity';
import { ITest } from '../ITest';
import { MinimunModel } from '../model/MinimunModel';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import { MinimunPrimaryModelManager } from './MinimunPrimaryModelManager';
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
      this._itMustPerformACachedSearchWithCachedEntities();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this._itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this._itMustPerformAnUncachedSearch();
      this._itMustPerformAnUnexistingCachedSearch();
      this._itMustPerformAnUnexistingUncachedSearch();
      this._itMustUpdateAnEntityInAQuery();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model);
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new NamesStartingByLetter(
          primaryModelManager,
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
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, [entity]);
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      await queryManager.deleteEntityInQueries(entity);
      expect(await queryManager.get(entity)).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, [entity]);
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
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

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity1: NamedEntity = {id: 1, name: 'Pepe'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity1);
      await primaryModelManager.deleteEntityFromCache(entity1);
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
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity1: NamedEntityAlternative = {id: '1', name: 'Pepe'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntityAlternative>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetterAlternative(
        primaryModelManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity1);
      await primaryModelManager.deleteEntityFromCache(entity1);
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
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, [entity]);
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      expect(await queryManager.get(entity)).toEqual([entity]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAnUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingCachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, new Array());
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
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
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, new Array());
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
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
      const model = new MinimunModel('id', ['id', 'name'], {prefix: prefix});
      const entity: NamedEntity = { id: 0, name: 'Pepe' };
      const entityAfter: NamedEntity = { id: 0, name: 'Paco' };
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, NamedEntity>(model, [entity]);
      const primaryModelManager = new MinimunPrimaryModelManager<MinimunModel, NamedEntity>(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const queryManager = new NamesStartingByLetter(
        primaryModelManager,
        secondaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        prefix + 'names-starting-with/',
      );
      await queryManager.get(entity);
      await queryManager.updateEntityInQueries(entityAfter);
      expect(await queryManager.get(entityAfter)).toEqual([entityAfter]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
