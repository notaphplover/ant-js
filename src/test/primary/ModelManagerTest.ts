import { Model } from '../../model/Model';
import { ITest } from '../ITest';
import { ModelManagerGenerator } from './ModelManagerGenerator';
import { RedisWrapper } from './RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

interface IEntityTest {
  id: number;
  numberField: number;
  strField: string;
}

const modelTestGenerator = (prefix: string) =>
  new Model('id', ['id', 'numberField', 'strField'], {prefix: prefix});

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
    this._declareName = 'MultipleResultQueyManagerTest';
    this._modelManagerGenerator = new ModelManagerGenerator();
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      try {
        this._modelManagerGenerator.generateModelManager(
          modelTestGenerator(prefix),
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
}
