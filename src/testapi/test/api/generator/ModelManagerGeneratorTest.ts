import { IModel } from '../../../../model/IModel';
import { ModelManager } from '../../../../persistence/primary/ModelManager';
import { RedisWrapper } from '../../../../test/primary/RedisWrapper';
import { SecondaryEntityManagerMock } from '../../../../test/secondary/SecondaryEntityManagerMock';
import { AntJsModelManagerGenerator } from '../../../api/generator/AntJsModelManagerGenerator';
import { ITest } from '../../../api/ITest';

export class ModelManagerGeneratorTest implements ITest {
  public performTests() {
    describe(ModelManagerGeneratorTest.name, () => {
      this._itMustBeInitializable();
      this._itMustGenerateAModelManagerWithMultipleResultQueries();
      this._itMustGenerateAModelManagerWithNoQueriesAndASecondaryModelManager();
      this._itMustGenerateAModelManagerWithSingleResultQueries();
    });
  }

  private _itMustBeInitializable(): void {
    it(this._itMustBeInitializable.name, async (done) => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new AntJsModelManagerGenerator(new RedisWrapper().redis);
      }).not.toThrowError();
      done();
    });
  }

  private _itMustGenerateAModelManagerWithMultipleResultQueries(): void {
    it(this._itMustGenerateAModelManagerWithMultipleResultQueries.name, async (done) => {
      const model: IModel = {
        id: 'id',
        keyGen: { prefix: 'random_prefix' },
      };
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const properties = ['pm1', 'pm2'];
      const [
        modelManager,
        ,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model: model,
        redisOptions: {
          multipleResultQueryManagersOptions: {
            properties: ['ps1', 'ps2'],
          },
        },
      });
      expect(modelManager instanceof ModelManager).toBe(true);
      expect(singleResultQueryManagers).toEqual(new Map());
      expect(multipleResultQueryManagers.size).toBe(properties.length);
      done();
    });
  }

  private _itMustGenerateAModelManagerWithNoQueriesAndASecondaryModelManager(): void {
    it(this._itMustGenerateAModelManagerWithNoQueriesAndASecondaryModelManager.name, async (done) => {
      const model: IModel = {
        id: 'id',
        keyGen: { prefix: 'random_prefix' },
      };
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const [
        modelManager,
        secondaryManager,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model: model,
      });
      expect(modelManager instanceof ModelManager).toBe(true);
      expect(secondaryManager instanceof SecondaryEntityManagerMock).toBe(true);
      expect(singleResultQueryManagers).toEqual(new Map());
      expect(multipleResultQueryManagers).toEqual(new Map());
      done();
    });
  }

  private _itMustGenerateAModelManagerWithSingleResultQueries(): void {
    it(this._itMustGenerateAModelManagerWithSingleResultQueries.name, async (done) => {
      const model: IModel = {
        id: 'id',
        keyGen: { prefix: 'random_prefix' },
      };
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const properties = ['ps1', 'ps2'];
      const [
        modelManager,
        ,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model: model,
        redisOptions: {
          singleResultQueryManagersOptions: {
            properties: ['ps1', 'ps2'],
          },
        },
      });
      expect(modelManager instanceof ModelManager).toBe(true);
      expect(singleResultQueryManagers.size).toBe(properties.length);
      expect(multipleResultQueryManagers).toEqual(new Map());
      done();
    });
  }
}
