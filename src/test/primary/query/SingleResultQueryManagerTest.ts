import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { Model } from '../../../model/Model';
import { IPrimaryEntityManager } from '../../../persistence/primary/IPrimaryEntityManager';
import { PrimaryEntityManager } from '../../../persistence/primary/PrimaryEntityManager';
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
      this.itMustBeInitializable();
      this.itMustDeleteAnEntityInAQuery();
      this.itMustDeleteMultipleEntitiesInQueries();
      this.itMustDeleteZeroEntitiesInQueries();
      this.itMustPerformACachedSearchWithCachedEntities();
      this.itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this.itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsString();
      this.itMustPerformACustomMultipleResultSearch();
      this.itMustPerformAMultipleCachedSearchWithCachedEntities();
      this.itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber();
      this.itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString();
      this.itMustPerformAMultipleUncachedSearch();
      this.itMustPerformAMultipleUnexistingCachedSearch();
      this.itMustPerformAMultipleUnexistingUncachedSearch();
      this.itMustPerformAMultipleZeroSearch();
      this.itMustPerformAnUncachedSearch();
      this.itMustPerformAnUnexistingCachedSearch();
      this.itMustPerformAnUnexistingUncachedSearch();
      this.itMustUpdateAnEntityInAQuery();
      this.itMustUpdateMultipleEntitiesInAQuery();
      this.itMustUpdateZeroEntitiesInAQuery();
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
    const model = new Model('id', ['id', 'field']);
    const secondaryEntityManager =
        new SecondaryEntityManagerMock<IEntity & {
          id: number,
          field: string,
        }>(model, entities);
    const primaryEntityManager = new PrimaryEntityManager<IEntity & {
      id: number,
      field: string,
    }>(
      { prefix: prefix },
      model,
      this._redis.redis,
      secondaryEntityManager,
    );
    return [
      model,
      primaryEntityManager,
      secondaryEntityManager,
    ];
  }

  private itMustBeInitializable(): void {
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

  private itMustDeleteAnEntityInAQuery(): void {
    const itsName = 'mustDeleteAnEntityInAQuery';
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
      await queryManager.syncDelete(entity1);
      const entityFoundAfter = await queryManager.get({ field: entity1.field });

      expect(entityFoundAfter).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustDeleteMultipleEntitiesInQueries(): void {
    const itsName = 'mustDeleteMultipleEntitiesInQueries';
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
      await queryManager.mGet([{ field: entity1.field }, { field: entity2.field }]);
      await queryManager.syncMDelete([entity1, entity2]);
      const entitiesFoundAfter = await queryManager.mGet([
        { field: entity1.field },
        { field: entity2.field },
      ]);
      expect(entitiesFoundAfter).toEqual(new Array());
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustDeleteZeroEntitiesInQueries(): void {
    const itsName = 'mustDeleteZeroEntitiesInQueries';
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
      await queryManager.mGet([
        { field: entity1.field },
      ]);
      secondaryEntityManager.store.length = 0;
      await queryManager.syncMDelete(new Array());
      const entitiesFoundAfter = await queryManager.mGet([
        { field: entity1.field },
      ]);
      expect(entitiesFoundAfter).toContain(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformACachedSearchWithCachedEntities(): void {
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

  private itMustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformACachedSearchWithoutCachedEntitiesWithIdAsNumber';
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
      await primaryEntityManager.delete(entity1);
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
      const model = new Model('id', ['id', 'field']);
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
        {prefix: prefix},
        model,
        this._redis.redis,
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
      await primaryEntityManager.delete(entity1);
      const entityFound = await queryManager.get({ field: entity1.field });
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformACustomMultipleResultSearch(): void {
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

  private itMustPerformAMultipleCachedSearchWithCachedEntities(): void {
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

  private itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsNumber';
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
      await primaryEntityManager.delete(entity1);
      const entitiesFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entitiesFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString(): void {
    const itsName = 'mustPerformAMultipleCachedSearchWithoutCachedEntitiesWithIdAsString';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const model = new Model('id', ['id', 'field']);
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
        {prefix: prefix},
        model,
        this._redis.redis,
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
      await primaryEntityManager.delete(entity1);
      const entityFound = await queryManager.mGet([{ field: entity1.field }]);
      expect(entityFound).toEqual([entity1]);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private itMustPerformAMultipleUncachedSearch(): void {
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

  private itMustPerformAMultipleUnexistingCachedSearch(): void {
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

  private itMustPerformAMultipleUnexistingUncachedSearch(): void {
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

  private itMustPerformAMultipleZeroSearch(): void {
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

  private itMustPerformAnUncachedSearch(): void {
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

  private itMustPerformAnUnexistingCachedSearch(): void {
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

  private itMustPerformAnUnexistingUncachedSearch(): void {
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

  private itMustUpdateAnEntityInAQuery(): void {
    const itsName = 'mustUpdateAnEntityInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1After: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-w'};
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
      secondaryEntityManager.store.length = 0;
      await primaryEntityManager.update(entity1After);
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
      await queryManager.mGet([{ field: entity1.field }, { field: entity2.field }]);
      secondaryEntityManager.store.length = 0;
      await primaryEntityManager.mUpdate([entity1After, entity2After]);
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

  private itMustUpdateZeroEntitiesInAQuery(): void {
    const itsName = 'mustUpdateZeroEntitiesInAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const [
        ,
        primaryEntityManager,
        secondaryEntityManager,
      ] = this._helperGenerateBaseInstances(prefix, [entity]);
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
      await queryManager.mGet([{ field: entity.field }]);
      secondaryEntityManager.store.length = 0;
      await queryManager.syncMUpdate(new Array());
      const entityByValue = await queryManager.get({ field: entity.field });

      expect(entityByValue).toEqual(entity);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
