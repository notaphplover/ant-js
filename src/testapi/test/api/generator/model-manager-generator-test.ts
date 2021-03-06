import { AntJsModelManagerGenerator } from '../../../api/generator/antjs-model-manager-generator';
import { AntModel } from '../../../../model/ant-model';
import { AntPrimaryModelManager } from '../../../../persistence/primary/ant-primary-model-manager';
import { Entity } from '../../../../model/entity';
import { Model } from '../../../../model/model';
import { RedisWrapper } from '../../../../test/primary/redis-wrapper';
import { SecondaryEntityManagerMock } from '../../../api/secondary/secondary-entity-manager-mock';
import { Test } from '../../../api/test';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

interface EntityTest extends Entity {
  id: number;
  numberField: number;
  strField: string;
}

export class ModelManagerGeneratorTest implements Test {
  protected _describeName: string;

  protected _redisCleanPromise: Promise<any>;

  public constructor(redisCleanPromise: Promise<any>) {
    this._describeName = ModelManagerGeneratorTest.name;
    this._redisCleanPromise = redisCleanPromise;
  }

  public performTests(): void {
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
        new AntJsModelManagerGenerator(new RedisWrapper().redis);
      }).not.toThrowError();
      done();
    });
  }

  private _itMustGenerateAModelManagerWithCustomSecondaryModelManager(): void {
    it(this._itMustGenerateAModelManagerWithCustomSecondaryModelManager.name, async (done) => {
      const model: Model<Entity> = new AntModel('id', { prefix: 'random_prefix' });
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const originalSecondaryManager = new SecondaryEntityManagerMock(model);
      const [, secondaryManager] = modelManagerGenerator.generateModelManager({
        model,
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
      const model: Model<Entity> = new AntModel('id', { prefix: 'random_prefix' });
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const properties = ['pm1', 'pm2'];
      const [
        modelManager,
        ,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model,
        redisOptions: {
          multipleResultQueryManagersOptions: {
            properties: ['ps1', 'ps2'],
          },
        },
      });
      expect(modelManager instanceof AntPrimaryModelManager).toBe(true);
      expect(singleResultQueryManagers).toEqual(new Map());
      expect(multipleResultQueryManagers.size).toBe(properties.length);
      done();
    });
  }

  private _itMustGenerateAModelManagerWithNoQueriesAndASecondaryModelManager(): void {
    it(this._itMustGenerateAModelManagerWithNoQueriesAndASecondaryModelManager.name, async (done) => {
      const model: Model<Entity> = new AntModel('id', { prefix: 'random_prefix' });
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const [
        modelManager,
        secondaryManager,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model,
      });
      expect(modelManager instanceof AntPrimaryModelManager).toBe(true);
      expect(secondaryManager instanceof SecondaryEntityManagerMock).toBe(true);
      expect(singleResultQueryManagers).toEqual(new Map());
      expect(multipleResultQueryManagers).toEqual(new Map());
      done();
    });
  }

  private _itMustGenerateAModelManagerWithSingleResultQueries(): void {
    it(this._itMustGenerateAModelManagerWithSingleResultQueries.name, async (done) => {
      const model: Model<Entity> = new AntModel('id', { prefix: 'random_prefix' });
      const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
      const properties = ['ps1', 'ps2'];
      const [
        modelManager,
        ,
        singleResultQueryManagers,
        multipleResultQueryManagers,
      ] = modelManagerGenerator.generateModelManager({
        model,
        redisOptions: {
          singleResultQueryManagersOptions: {
            properties: ['ps1', 'ps2'],
          },
        },
      });
      expect(modelManager instanceof AntPrimaryModelManager).toBe(true);
      expect(singleResultQueryManagers.size).toBe(properties.length);
      expect(multipleResultQueryManagers).toEqual(new Map());
      done();
    });
  }

  private _itMustGenerateAMRQManagerAndSearchEntitiesByProperty(): void {
    const itsName = this._itMustGenerateAMRQManagerAndSearchEntitiesByProperty.name;

    it(
      itsName,
      async (done) => {
        await this._redisCleanPromise;

        const modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
        const model: Model<EntityTest> = new AntModel('id', { prefix: 'random_prefix' });

        const entity1: EntityTest = {
          id: 0,
          numberField: 1,
          strField: 'a',
        };
        const entity2: EntityTest = {
          id: 1,
          numberField: 2,
          strField: 'b',
        };

        const entities: EntityTest[] = [entity1, entity2];
        const secondaryEntityManager = new SecondaryEntityManagerMock<EntityTest>(model, entities);
        const [, , singleResultQueryManagers, multipleResultQueryManagers] = modelManagerGenerator.generateModelManager(
          {
            model,
            redisOptions: {
              multipleResultQueryManagersOptions: {
                properties: ['numberField', 'strField'],
              },
              singleResultQueryManagersOptions: {
                properties: ['numberField', 'strField'],
              },
              useEntityNegativeCache: true,
            },
            secondaryOptions: {
              manager: secondaryEntityManager,
            },
          },
        );

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
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
