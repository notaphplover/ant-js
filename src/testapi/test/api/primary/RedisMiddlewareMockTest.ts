import { IEntity } from '../../../../model/IEntity';
import { IModel } from '../../../../model/IModel';
import { Model } from '../../../../model/Model';
import { IPrimaryEntityManager } from '../../../../persistence/primary/IPrimaryEntityManager';
import { IPrimaryQueryManager } from '../../../../persistence/primary/query/IPrimaryQueryManager';
import { ModelManagerGenerator } from '../../../../test/primary/ModelManagerGenerator';
import { MultipleResultQueryByFieldManager } from '../../../../test/primary/query/MultipleResultQueryByFieldManager';
import { SecondaryEntityManagerMock } from '../../../../test/secondary/SecondaryEntityManagerMock';
import { ITest } from '../../../api/ITest';
import { RedisMiddlewareMock } from '../../../api/primary/RedisMiddlewareMock';

interface IEntityTest extends IEntity {
  id: number;
  numberField: number;
  strField: string;
}

const modelTestProperties = ['id', 'numberField', 'strField'];
const modelTestGenerator = (prefix: string) => new Model('id', {prefix: prefix});

export class RedisMiddlewareMockTest implements ITest {

  /**
   * Model manager generator.
   */
  protected _modelManagerGenerator: ModelManagerGenerator<IEntityTest>;

  public constructor() {
    this._modelManagerGenerator = new ModelManagerGenerator();
  }

  public performTests(): void {
    describe(RedisMiddlewareMockTest.name, () => {
      this._itMustBeInitializable();
      this._itMustNotBreakAModelManagerDelete();
      this._itMustNotBreakAModelManagerGet();
      this._itMustNotBreakAModelManagerMDelete();
      this._itMustNotBreakAModelManagerMGet();
      this._itMustNotBreakAModelManagerMUpdate();
      this._itMustNotBreakAModelManagerUpdate();
      this._itMustNotBreakAMultipleResultQueryManagerGet();
      this._itMustNotBreakASingleResultQueryManagerGet();
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
    const searchEntityByPrimaryEntityManager = await primaryEntityManager.get(entity[model.id]);
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

  private _itMustBeInitializable(): void {
    it('It must be initializable', async (done) => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new RedisMiddlewareMock();
      }).not.toThrowError();
      done();
    });
  }

  private _itMustNotBreakAModelManagerDelete(): void {
    const itsName = 'It must not break a model manager delete';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entityToDelete: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'one',
      };
      const anotherEntity = {
        id: 1,
        numberField: 2,
        strField: 'two',
      };
      const [modelManager] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [anotherEntity]),
        true,
        new RedisMiddlewareMock(),
      );

      await modelManager.delete(entityToDelete.id);
      const entityFound = await modelManager.get(anotherEntity.id);
      expect(entityFound).toEqual(anotherEntity);
      done();
    });
  }

  private _itMustNotBreakAModelManagerGet(): void {
    const itsName = 'It must not break a model manager get';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entity = {
        id: 1,
        numberField: 2,
        strField: 'two',
      };
      const [modelManager] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [entity]),
        true,
        new RedisMiddlewareMock(),
      );

      const entityFound = await modelManager.get(entity.id);
      expect(entityFound).toEqual(entity);
      done();
    });
  }

  private _itMustNotBreakAModelManagerMDelete(): void {
    const itsName = 'It must not break a model manager mDelete';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entityToDelete: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'one',
      };
      const anotherEntity = {
        id: 1,
        numberField: 2,
        strField: 'two',
      };
      const [modelManager] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [anotherEntity]),
        true,
        new RedisMiddlewareMock(),
      );

      await modelManager.mDelete([entityToDelete.id]);
      const entityFound = await modelManager.get(anotherEntity.id);
      expect(entityFound).toEqual(anotherEntity);
      done();
    });
  }

  private _itMustNotBreakAModelManagerMGet(): void {
    const itsName = 'It must not break a model manager mGet';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entity = {
        id: 1,
        numberField: 2,
        strField: 'two',
      };
      const [modelManager] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [entity]),
        true,
        new RedisMiddlewareMock(),
      );

      const entityFound = await modelManager.mGet([entity.id]);
      expect(entityFound).toContain(entity);
      done();
    });
  }

  private _itMustNotBreakAModelManagerMUpdate(): void {
    const itsName = 'It must not break a model manager mUpdate';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entityToUpdate: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'one',
      };
      const [modelManager] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [entityToUpdate]),
        true,
        new RedisMiddlewareMock(),
      );

      await modelManager.mUpdate([entityToUpdate]);
      const entityFound = await modelManager.get(entityToUpdate.id);
      expect(entityFound).toEqual(entityToUpdate);
      done();
    });
  }

  private _itMustNotBreakAModelManagerUpdate(): void {
    const itsName = 'It must not break a model manager update';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entityToUpdate: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'one',
      };
      const [modelManager] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [entityToUpdate]),
        true,
        new RedisMiddlewareMock(),
      );

      await modelManager.update(entityToUpdate);
      const entityFound = await modelManager.get(entityToUpdate.id);
      expect(entityFound).toEqual(entityToUpdate);
      done();
    });
  }

  private _itMustNotBreakAMultipleResultQueryManagerGet(): void {
    const itsName = '';
    const prefix = '';
    it(itsName, async (done) => {
      const entity1: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'a',
      };
      const entities: IEntityTest[] = [
        entity1,
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
      const query = new MultipleResultQueryByFieldManager(
        (params: any) =>
          new Promise((resolve) => {
            const entities = secondaryEntityManager.store.filter(
              (entity) => params.strField === entity.strField,
            );
            resolve(entities.map((entity) => entity.id));
          }),
        primaryEntityManager,
        new RedisMiddlewareMock(),
        prefix + 'reverse/',
        'strField',
        prefix + 'query/',
      );
      modelManager.addQuery(query);
      await query.get(entity1);
      const [ entityFound ] = await query.get(entity1);
      expect(entityFound).toEqual(entity1);
      done();
    });
  }

  private _itMustNotBreakASingleResultQueryManagerGet(): void {
    const itsName = 'It must not break a single result query manager get';
    const prefix = RedisMiddlewareMockTest.name + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelTestGenerator(prefix);
      const entity: IEntityTest = {
        id: 0,
        numberField: 1,
        strField: 'one',
      };
      const [, primaryEntityManager , queryManagersByProperty] = this._modelManagerGenerator.generateModelManager(
        model,
        modelTestProperties,
        prefix + 'query/',
        prefix + 'reverse/',
        new SecondaryEntityManagerMock(model, [entity]),
        true,
        new RedisMiddlewareMock(),
      );

      const [
        searchEntityByPrimaryEntityManager,
        searchEntityByQueryManager,
      ] = await this._helperSearchEntity(entity, model, primaryEntityManager, queryManagersByProperty);

      expect(searchEntityByPrimaryEntityManager).toEqual(entity);
      for (const search of searchEntityByQueryManager) {
        expect(search).toEqual(entity);
      }
      done();
    });
  }
}
