import { IEntity } from '../../model/IEntity';
import { Model } from '../../model/Model';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ITest } from '../ITest';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
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
    describe(this._declareName, () => {
      this.itMustBeInitializable();
      this.itMustDeleteAnEntityInAQuery();
      this.itMustPerformACachedSearchWithCachedEntities();
      this.itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this.itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this.itMustPerformAMultipleUncachedSearch();
      this.itMustPerformAnUncachedSearch();
      this.itMustPerformAnUnexistingCachedSearch();
      this.itMustPerformAnUnexistingUncachedSearch();
      this.itMustUpdateAnEntityInAQuery();
      this.itMustUpdateMultipleEntitiesInAQuery();
    });
  }

  private itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        null,
      );
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new SingleResultQueryByFieldManager(
          async (params: any) =>  null,
          primaryEntityManager,
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
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      secondaryModelManager.store.length = 0;
      const entityFoundBefore = await queryManager.get({ field: entity1.field });
      await primaryEntityManager.deleteEntityFromCache(entity1);
      await queryManager.syncDelete(entity1);
      const entityFoundAfter = await queryManager.get({ field: entity1.field });

      expect(entityFoundBefore).toEqual(entity1);
      expect(entityFoundAfter).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
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
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      await primaryEntityManager.deleteEntityFromCache(entity1);
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
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: string,
        field: string,
      } = {id: '1', field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: string,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      await primaryEntityManager.deleteEntityFromCache(entity1);
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAMultipleUncachedSearch(): void {
    const itsName = 'mustPerformAMultipleUncachedSearch';
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
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      const entitiesFound = await queryManager.mGet([{ field: entity1.field }, { field: entity2.field }]);
      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAnUncachedSearch(): void {
    const itsName = 'mustPerformAnUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
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
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, []);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
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
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, []);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustUpdateAnEntityInAQuery(): void {
    const itsName = 'mustUpdateAnEntityInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1After: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-w'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.get({ field: entity1.field });
      secondaryModelManager.store.length = 0;
      await primaryEntityManager.cacheEntity(entity1After);
      await queryManager.syncUpdate(entity1After);
      const entityByOldValue = await queryManager.get({ field: entity1.field });
      const entityByNewValue = await queryManager.get({ field: entity1After.field });

      expect(entityByOldValue).toBeNull();
      expect(entityByNewValue).toEqual(entity1After);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustUpdateMultipleEntitiesInAQuery(): void {
    const itsName = 'mustUpdateMultipleEntitiesInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field'], {prefix: prefix});
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1After: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1-after'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const entity2After: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2-after'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, [entity1, entity2]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryModelManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
      );
      await queryManager.mGet([{ field: entity1.field }, { field: entity2.field }]);
      secondaryModelManager.store.length = 0;
      await primaryEntityManager.cacheEntities([entity1After, entity2After]);
      await queryManager.syncMUpdate([entity1After, entity2After]);
      const entity1ByOldValue = await queryManager.get({ field: entity1.field });
      const entity1ByNewValue = await queryManager.get({ field: entity1After.field });
      const entity2ByOldValue = await queryManager.get({ field: entity2.field });
      const entity2ByNewValue = await queryManager.get({ field: entity2After.field });

      expect(entity1ByOldValue).toBeNull();
      expect(entity1ByNewValue).toEqual(entity1After);
      expect(entity2ByOldValue).toBeNull();
      expect(entity2ByNewValue).toEqual(entity2After);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
