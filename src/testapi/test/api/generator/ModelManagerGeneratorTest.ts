import { IEntity } from '../../../../model/IEntity';
import { IModel } from '../../../../model/IModel';
import { ModelManager } from '../../../../persistence/primary/ModelManager';
import { RedisWrapper } from '../../../../test/primary/RedisWrapper';
import { AntJsModelManagerGenerator } from '../../../api/generator/AntJsModelManagerGenerator';
import { ITest } from '../../../api/ITest';
import { SecondaryEntityManagerMock } from '../../../api/secondary/SecondaryEntityManagerMock';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

interface IEntityTest extends IEntity {
  id: number;
  numberField: number;
  strField: string;
}

export class ModelManagerGeneratorTest implements ITest {

  protected _describeName: string;

  protected _redisCleanPromise: Promise<any>;

  public constructor(redisCleanPromise: Promise<any>) {
    this._describeName = ModelManagerGeneratorTest.name;
    this._redisCleanPromise = redisCleanPromise;
  }

  public performTests() {
    describe(this._describeName, () => {
      this._itMustBeInitializable();
      this._itMustGenerateAModelManagerWithCustomSecondaryModelManager();
      this._itMustGenerateAModelManagerWithMultipleResultQueries();
      this._itMustGenerateAModelManagerWithNoQueriesAndASecondaryModelManager();
      this._itMustGenerateAModelManagerWithSingleResultQueries();
      this._itMustGenerateAMRQManagerAndSearchEntitiesByProperty();
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

  private _itMustGenerateAModelManagerWithCustomSecondaryModelManager(): void {
    it(this._itMustGenerateAModelManagerWithCustomSecondaryModelManager.name, async (done) => {
      const model: IModel = {
        id: 'id',
        keyGen: { prefix: 'random_prefix' },
      };
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const originalSecondaryManager = new SecondaryEntityManagerMock(model);
      const [
        ,
        secondaryManager,
        ,
        ,
      ] = modelManagerGenerator.generateModelManager({
        model: model,
        secondaryOptions: {
          manager: originalSecondaryManager,
        },
      });
      expect(secondaryManager).toBe(originalSecondaryManager);
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

  private _itMustGenerateAMRQManagerAndSearchEntitiesByProperty(): void {
    const itsName = this._itMustGenerateAMRQManagerAndSearchEntitiesByProperty.name;
    const prefix = this._describeName + '/' + itsName + '/';

    it(itsName, async (done) => {
      await this._redisCleanPromise;

      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);

      const model: IModel = {
        id: 'id',
        keyGen: { prefix: prefix },
      };

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
      const secondaryEntityManager = new SecondaryEntityManagerMock<IEntityTest>(
        model,
        entities,
      );
      const [
        ,
        ,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model: model,
        redisOptions: {
          multipleResultQueryManagersOptions: {
            properties: [ 'numberField', 'strField' ],
          },
          singleResultQueryManagersOptions: {
            properties: [ 'numberField', 'strField' ],
          },
          useEntityNegativeCache: true,
        },
        secondaryOptions: {
          manager: secondaryEntityManager,
        },
      });

      const [srqmResults, mrqmResults] = modelManagerGenerator.searchEntititiesInQueries(
        entities,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      );

      for (const [[entityToSearch], entityFound] of srqmResults) {
        expect(await entityFound).toEqual(entityToSearch);
      }

      for (const [[entityToSearch], entitiesFound] of mrqmResults) {
        expect(await entitiesFound).toEqual([entityToSearch]);
      }

      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
