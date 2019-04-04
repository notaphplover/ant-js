import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { Model } from '../../model/Model';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { IPrimaryQueryManager } from '../../persistence/primary/query/IPrimaryQueryManager';
import { ITest } from '../ITest';
import { SecondaryEntityManagerMock } from '../secondary/SecondaryEntityManagerMock';
import { ModelManagerGenerator } from './ModelManagerGenerator';
import { SingleResultQueryByFieldManager } from './query/SingleResultQueryByFieldManager';
import { RedisWrapper } from './RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

interface IEntityTest extends IEntity {
  id: number;
  numberField: number;
  strField: string;
}
const modelTestProperties = ['id', 'numberField', 'strField'];
const modelTestGenerator = (prefix: string) => new Model('id', {prefix: prefix});

export class ModelManagerTest implements ITest {
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
  protected _modelManagerGenerator: ModelManagerGenerator<IEntityTest>;
  /**
   * Redis Wrapper
   */
  protected _redis: RedisWrapper;

  /**
   * Creates a new ModelManagerTest.
   * @param beforeAllPromise Before all promise.
   */
  public constructor(beforeAllPromise: Promise<any>) {
    this._beforeAllPromise = beforeAllPromise;
    this._declareName = 'ModelManagerTest';
    this._modelManagerGenerator = new ModelManagerGenerator();
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustAddAQuery();
      this._itMustBeInitializable();
      this._itMustBeInitializableWithNoQueries();
      this._itMustDeleteAnEntity();
      this._itMustDeleteMultipleEntities();
      this._itMustGetAnEntity();
      this._itMustGetMultipleEntities();
      this._itMustUpdateAnEntity();
      this._itMustUpdateMultipleEntities();
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
    entity: IEntityTest,
    model: IModel,
    primaryEntityManager: IPrimaryEntityManager<IEntityTest>,
    queriesMap: Map<string, IPrimaryQueryManager<IEntityTest>>,
  ): Promise<[IEntityTest, IEntityTest[]]> {
    const searchEntityByPrimaryEntityManager = await primaryEntityManager.getById(entity[model.id]);
    const searchEntityByQueryManager = new Array();
    for (const [property, query] of queriesMap) {
      const searchArgs: any = {};
      searchArgs[property] = entity[property];
      const result = await query.get(searchArgs);
      searchEntityByQueryManager.push(result);
    }
    return [
      searchEntityByPrimaryEntityManager,
      searchEntityByQueryManager,
    ];
  }

  private _itMustAddAQuery(): void {
    const itsName = 'mustAddAQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
        primaryEntityManager,
      ] = this._modelManagerGenerator.generateZeroQueriesModelManager(
        model,
        secondaryEntityManager,
      );

      const singleResultQueryManager = new SingleResultQueryByFieldManager<IEntityTest>(
        (params: any) =>
          new Promise((resolve) => {
            const entity = secondaryEntityManager.store.find(
              (value: IEntityTest) => value.strField === params.strField,
            );
            resolve(entity ? entity[model.id] : null);
          }),
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/strField/',
        'strField',
        prefix + 'query/strField/',
      );

      modelManager.addQuery(singleResultQueryManager);
      await singleResultQueryManager.get(entity1);
      await modelManager.delete(entity1);

      const entity1Search = await singleResultQueryManager.get(entity1);
      expect(entity1Search).toBeNull();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      try {
        this._modelManagerGenerator.generateModelManager(
          modelTestGenerator(prefix),
          modelTestProperties,
          prefix + 'query/',
          prefix + 'reverse/',
          null,
        );
      } catch {
        fail();
      } finally {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustBeInitializableWithNoQueries(): void {
    const itsName = 'mustBeInitializableWithNoQueries';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      try {
        this._modelManagerGenerator.generateZeroQueriesModelManager(
          modelTestGenerator(prefix),
          null,
        );
      } catch {
        fail();
      } finally {
        done();
      }
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteAnEntity(): void {
    const itsName = 'mustDeleteAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
        primaryEntityManager,
        queryManagersByProperty,
      ] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        secondaryEntityManager,
      );
      secondaryEntityManager.store.shift();
      await modelManager.delete(entity1);

      const [
        searchEntity1ByPrimaryEntityManager,
        searchEntity1ByQueryManager,
      ] = await this._helperSearchEntity(entity1, model, primaryEntityManager, queryManagersByProperty);
      const [
        searchEntity2ByPrimaryEntityManager,
        searchEntity2ByQueryManager,
      ] = await this._helperSearchEntity(entity2, model, primaryEntityManager, queryManagersByProperty);

      expect(searchEntity1ByPrimaryEntityManager).toBeNull();
      for (const search of searchEntity1ByQueryManager) {
        expect(search).toBeNull();
      }
      expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
      for (const search of searchEntity2ByQueryManager) {
        expect(search).toEqual(entity2);
      }
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustDeleteMultipleEntities(): void {
    const itsName = 'mustDeleteMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entity3: IEntityTest = {
        id: 2,
        numberField: 3,
        strField: 'c',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
        entity3,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
        primaryEntityManager,
        queryManagersByProperty,
      ] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        secondaryEntityManager,
      );
      secondaryEntityManager.store.shift();
      secondaryEntityManager.store.shift();
      await modelManager.mDelete([entity1, entity2]);

      const [
        searchEntity1ByPrimaryEntityManager,
        searchEntity1ByQueryManager,
      ] = await this._helperSearchEntity(entity1, model, primaryEntityManager, queryManagersByProperty);
      const [
        searchEntity2ByPrimaryEntityManager,
        searchEntity2ByQueryManager,
      ] = await this._helperSearchEntity(entity2, model, primaryEntityManager, queryManagersByProperty);
      const [
        searchEntity3ByPrimaryEntityManager,
        searchEntity3ByQueryManager,
      ] = await this._helperSearchEntity(entity3, model, primaryEntityManager, queryManagersByProperty);

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
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetAnEntity(): void {
    const itsName = 'mustGetAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
      ] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        secondaryEntityManager,
      );
      const entityFound = await modelManager.get(entity1[model.id]);
      expect(entityFound).toEqual(entity1);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetMultipleEntities(): void {
    const itsName = 'mustGetMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
      ] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        secondaryEntityManager,
      );
      const entityFound = await modelManager.mGet([
        entity1[model.id],
        entity2[model.id],
      ]);
      expect(entityFound).toContain(entity1);
      expect(entityFound).toContain(entity2);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustUpdateAnEntity(): void {
    const itsName = 'mustUpdateAnEntity';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entity1After: IEntityTest = {
        id: 0,
        numberField: 11,
        strField: 'aa',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
        primaryEntityManager,
        queryManagersByProperty,
      ] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        secondaryEntityManager,
      );
      await modelManager.update(entity1After);

      const [
        searchEntity1ByPrimaryEntityManager,
        searchEntity1ByQueryManager,
      ] = await this._helperSearchEntity(entity1After, model, primaryEntityManager, queryManagersByProperty);
      const [
        searchEntity2ByPrimaryEntityManager,
        searchEntity2ByQueryManager,
      ] = await this._helperSearchEntity(entity2, model, primaryEntityManager, queryManagersByProperty);

      expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1After);
      for (const search of searchEntity1ByQueryManager) {
        expect(search).toEqual(entity1After);
      }
      expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
      for (const search of searchEntity2ByQueryManager) {
        expect(search).toEqual(entity2);
      }
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustUpdateMultipleEntities(): void {
    const itsName = 'mustUpdateMultipleEntities';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entity2: IEntityTest = {
        id: 1,
        numberField: 2,
        strField: 'b',
      };
      const entity1After: IEntityTest = {
        id: 0,
        numberField: 11,
        strField: 'aa',
      };
      const entities: IEntityTest[] = [
        entity1,
        entity2,
      ];
      const model = modelTestGenerator(prefix);
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        modelManager,
        primaryEntityManager,
        queryManagersByProperty,
      ] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        secondaryEntityManager,
      );
      await modelManager.mUpdate([entity1After]);

      const [
        searchEntity1ByPrimaryEntityManager,
        searchEntity1ByQueryManager,
      ] = await this._helperSearchEntity(entity1After, model, primaryEntityManager, queryManagersByProperty);
      const [
        searchEntity2ByPrimaryEntityManager,
        searchEntity2ByQueryManager,
      ] = await this._helperSearchEntity(entity2, model, primaryEntityManager, queryManagersByProperty);

      expect(searchEntity1ByPrimaryEntityManager).toEqual(entity1After);
      for (const search of searchEntity1ByQueryManager) {
        expect(search).toEqual(entity1After);
      }
      expect(searchEntity2ByPrimaryEntityManager).toEqual(entity2);
      for (const search of searchEntity2ByQueryManager) {
        expect(search).toEqual(entity2);
      }
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
