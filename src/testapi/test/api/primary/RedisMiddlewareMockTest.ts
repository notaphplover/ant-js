import { IEntity } from '../../../../model/IEntity';
import { Model } from '../../../../model/Model';
import { ModelManagerGenerator } from '../../../../test/primary/ModelManagerGenerator';
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
    });
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
}
