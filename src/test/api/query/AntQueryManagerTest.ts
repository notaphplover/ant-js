import { IAntQueryManager } from '../../../api/query/IAntQueryManager';
import { IEntity } from '../../../model/IEntity';
import { Model } from '../../../model/Model';
import { PrimaryEntityManager } from '../../../persistence/primary/PrimaryEntityManager';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';
import { ITest } from '../../ITest';
import { SingleResultQueryByFieldManager } from '../../primary/query/SingleResultQueryByFieldManager';
import { RedisWrapper } from '../../primary/RedisWrapper';
import { MinimalAntQueryManager } from './MinimalAntQueryManager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

const modelGenerator = (prefix: string) => new Model('id', {prefix: prefix});

type EntityTest = {id: number} & IEntity;

export class AntQueryManagerTest implements ITest {

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
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new MinimalAntQueryManager<EntityTest, EntityTest>(null);
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustCallQueryManagerMethods(): void {
    const itsName = 'mustCallQueryManagerMethods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const primaryEntityManager = new PrimaryEntityManager<EntityTest, ISecondaryEntityManager<EntityTest>>(
        model,
        this._redis.redis,
        null,
      );
      const queryManager = new SingleResultQueryByFieldManager<EntityTest>(
        async (params: any) =>  null,
        primaryEntityManager,
        this._redis.redis,
        prefix + 'reverse/',
        'id',
        prefix + 'query-by-field/',
      );
      const antQueryManager = new MinimalAntQueryManager(queryManager);
      const methodsToTest = [
        'get',
        'mGet',
      ] as Array<keyof IAntQueryManager<any, any>>;

      for (const methodToTest of methodsToTest) {
        spyOn(queryManager, methodToTest).and.returnValue(methodToTest as any);
      }

      const entity: EntityTest = { id: 0 };

      const [
        getResult,
        mGetResult,
      ] = await Promise.all([
        antQueryManager.get(entity),
        antQueryManager.mGet([entity]),
      ]);

      const results: {[key: string]: any} = {
        get: getResult,
        mGet: mGetResult,
      };

      for (const methodToTest of methodsToTest) {
        expect(queryManager[methodToTest]).toHaveBeenCalled();
        expect(results[methodToTest]).toBe(methodToTest);
      }

      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
