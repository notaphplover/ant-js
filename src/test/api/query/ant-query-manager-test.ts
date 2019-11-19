import { ApiQueryManager } from '../../../api/query/api-query-manager';
import { AntModel } from '../../../model/ant-model';
import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { AntPrimaryEntityManager } from '../../../persistence/primary/ant-primary-entity-manager';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';
import { Test } from '../../../testapi/api/test';
import { SingleResultQueryByFieldManager } from '../../primary/query/single-result-query-by-field-manager';
import { RedisWrapper } from '../../primary/redis-wrapper';
import { MinimalAntQueryManager } from './minimal-ant-query-manager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

type EntityTest = { id: number } & Entity;

const modelGenerator = (prefix: string): AntModel<EntityTest> => new AntModel<EntityTest>('id', { prefix });

export class AntQueryManagerTest implements Test {
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
    this._declareName = 'AntQueryManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustCallQueryManagerMethods();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    it(
      itsName,
      async (done) => {
        expect(() => {
          new MinimalAntQueryManager<EntityTest, EntityTest>(null);
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCallQueryManagerMethods(): void {
    const itsName = 'mustCallQueryManagerMethods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model: Model<EntityTest> = modelGenerator(prefix);
        const primaryEntityManager = new AntPrimaryEntityManager<EntityTest, SecondaryEntityManager<EntityTest>>(
          model,
          this._redis.redis,
          null,
        );
        const queryManager = new SingleResultQueryByFieldManager<EntityTest>(
          async () => null,
          primaryEntityManager,
          this._redis.redis,
          prefix + 'reverse/',
          'id',
          prefix + 'query-by-field/',
        );
        const antQueryManager = new MinimalAntQueryManager(queryManager);
        const methodsToTest = ['get', 'mGet'] as Array<keyof ApiQueryManager<any, any>>;

        for (const methodToTest of methodsToTest) {
          spyOn(queryManager, methodToTest).and.returnValue(methodToTest as any);
        }

        const entity: EntityTest = { id: 0 };

        const [getResult, mGetResult] = await Promise.all([
          antQueryManager.get(entity),
          antQueryManager.mGet([entity]),
        ]);

        const results: { [key: string]: any } = {
          get: getResult,
          mGet: mGetResult,
        };

        for (const methodToTest of methodsToTest) {
          expect(queryManager[methodToTest]).toHaveBeenCalled();
          expect(results[methodToTest]).toBe(methodToTest);
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
