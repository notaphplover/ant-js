import { IEntity } from '../../model/IEntity';
import { ITest } from '../ITest';
import { MinimunModel } from '../model/MinimunModel';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import { MinimunPrimaryModelManager } from './MinimunPrimaryModelManager';
import { RedisWrapper } from './RedisWrapper';
import { SingleResultQueryByFieldManager } from './SingleResultQueryByFieldManager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class SingleResultQueryManagerTest implements ITest {
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
    describe('SingleResultQueryManagerTest', () => {
      this.itMustBeInitializable();
      this.itMustDeleteAnEntityInAQuery();
      this.itMustPerformACachedSearchWithCachedEntities();
      this.itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this.itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this.itMustPerformAnUncachedSearch();
      this.itMustPerformAnUnexistingCachedSearch();
      this.itMustPerformAnUnexistingUncachedSearch();
      this.itMustUpdateAnEntityInAQuery();
    });
  }

  private itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
      );
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new SingleResultQueryByFieldManager(
          async (params: any) =>  null,
          primaryModelManager,
          this._redis.redis,
          prefix + 'reverse/',
          'field',
          prefix + 'query-by-field/',
        );
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustDeleteAnEntityInAQuery(): void {
    const itsName = 'mustDeleteAnEntityInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      secondaryModelManager.store.length = 0;
      const entityFoundBefore = await queryManager.get({ field: entity1.field });
      await primaryModelManager.deleteEntityFromCache(entity1);
      await queryManager.deleteEntityInQueries(entity1);
      const entityFoundAfter = await queryManager.get({ field: entity1.field });

      expect(entityFoundBefore).toEqual(entity1);
      expect(entityFoundAfter).not.toBeDefined();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      await primaryModelManager.deleteEntityFromCache(entity1);
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: string,
        field: string,
      } = {id: '1', field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: string,
          field: string,
        }>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      await primaryModelManager.deleteEntityFromCache(entity1);
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAnUncachedSearch(): void {
    const itsName = 'mustPerformAnUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAnUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingCachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, []);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAnUnexistingUncachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, []);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).not.toBeDefined();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustUpdateAnEntityInAQuery(): void {
    const itsName = 'mustUpdateAnEntityInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new MinimunModel('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1After: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-w'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (undefined === entityFound) {
          return undefined;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryModelManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      secondaryModelManager.store.length = 0;
      await primaryModelManager.cacheEntity(entity1After);
      await queryManager.updateEntityInQueries(entity1After);
      const entityByOldValue = await queryManager.get({ field: entity1.field });
      const entityByNewValue = await queryManager.get({ field: entity1After.field });

      expect(entityByOldValue).toBeUndefined();
      expect(entityByNewValue).toEqual(entity1After);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
