import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { Model } from '../../../model/Model';
import { IPrimaryEntityManager } from '../../../persistence/primary/IPrimaryEntityManager';
import { ModelManager } from '../../../persistence/primary/ModelManager';
import { PrimaryEntityManager } from '../../../persistence/primary/PrimaryEntityManager';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';
import { ITest } from '../../ITest';
import { SecondaryEntityManagerMock } from '../../secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from '../RedisWrapper';
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
      this._itMustBeInitializable();
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
    entities: Array<IEntity & {
      id: number,
      field: string,
    }>,
  ): [
    IModel,
    IPrimaryEntityManager<IEntity & {
      id: number,
      field: string,
    }>,
    SecondaryEntityManagerMock<IEntity & {
      id: number,
      field: string,
    }>,
  ] {
    const model = new Model('id', { prefix: prefix });
    const secondaryEntityManager =
        new SecondaryEntityManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, entities);
    type TestModel = IEntity & {
      id: number,
      field: string,
    };
    const primaryEntityManager = new PrimaryEntityManager<TestModel, ISecondaryEntityManager<TestModel>>(
      model,
      this._redis.redis,
      true,
      secondaryEntityManager,
    );
    return [
      model,
      primaryEntityManager,
      secondaryEntityManager,
    ];
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        ,
        primaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
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

  private _itMustPerformACachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformACachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        false,
        secondaryEntityManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      await modelManager.delete(entity1.id);
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', {prefix: prefix});
      const entity1: IEntity & {
        id: string,
        field: string,
      } = {id: '1', field: 'sample-1'};
      const secondaryEntityManager =
        new SecondaryEntityManagerMock<IEntity & {
          id: string,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        true,
        secondaryEntityManager,
      );
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        false,
        secondaryEntityManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      await modelManager.delete(entity1.id);
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformACustomMultipleResultSearch(): void {
    const itsName = 'mustPerformACustomMultipleResultSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1, entity2]);
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
        if (null == entityFound) {
          return null;
        } else {
          return entityFound.id;
        }
      };
      const mQuery = async (paramsArray: any[]) => {
        const results = new Array(paramsArray.length);
        const resultsMap = new Map<string, number>();
        for (let i = 0; i < paramsArray.length; ++i) {
          results[i] = null;
          resultsMap.set(paramsArray[i].field, i);
        }
        for (const entity of secondaryEntityManager.store) {
          const index = resultsMap.get(entity.field);
          if (null != index) {
            results[index] = entity.id;
          }
        }
        return results;
      };
      const queryManager = new SingleResultQueryByFieldManager(
        query,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'field',
        prefix + 'query-by-field/',
        mQuery,
      );
      const entitiesFound = await queryManager.mGet([{ field: entity1.field }, { field: entity2.field }]);
      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAMultipleCachedSearchWithCachedEntities(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithCachedEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      await queryManager.mGet([{ field: entity1.field }]);
      const entityFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entityFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        false,
        secondaryEntityManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      await queryManager.mGet([{ field: entity1.field }]);
      await modelManager.delete(entity1.id);
      const entitiesFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entitiesFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', {prefix: prefix});
      const entity1: IEntity & {
        id: string,
        field: string,
      } = {id: '1', field: 'sample-1'};
      const secondaryEntityManager =
        new SecondaryEntityManagerMock<IEntity & {
          id: string,
          field: string,
        }>(model, [entity1]);
      const primaryEntityManager = new PrimaryEntityManager(
        model,
        this._redis.redis,
        true,
        secondaryEntityManager,
      );
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        false,
        secondaryEntityManager,
      );
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      await queryManager.mGet([{ field: entity1.field }]);
      await modelManager.delete(entity1.id);
      const entityFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entityFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAMultipleUncachedSearch(): void {
    const itsName = 'mustPerformAMultipleUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1, entity2]);
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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

  private _itMustPerformAMultipleUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAMultipleUnexistingCacheSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      await queryManager.mGet([{ field: entity1.field }]);
      const entityFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entityFound).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAMultipleUnexistingUncachedSearch(): void {
    const itsName = 'mustPerformAMultipleUnexistingUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      const entityFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entityFound).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAMultipleZeroSearch(): void {
    const itsName = 'mustPerformAMultipleZeroSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
      const entityFound = await queryManager.mGet(new Array());
      expect(entityFound).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustPerformAnUncachedSearch(): void {
    const itsName = 'mustPerformAnUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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

  private _itMustPerformAnUnexistingCachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingCachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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

  private _itMustPerformAnUnexistingUncachedSearch(): void {
    const itsName = 'mustPerformAnUnexistingUncachedSearch';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, new Array());
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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

  private _itMustProcessANegativeCachedEntity(): void {
    const itsName = 'mustProcessANegativeCachedEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        model,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity1]);
      const modelManager = new ModelManager(
        model,
        this._redis.redis,
        true,
        secondaryEntityManager,
      );
      modelManager.delete(entity1[model.id]);
      const query = async (params: any) => {
        const entityFound = secondaryEntityManager.store.find((entity) => params.field === entity.field);
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
}
