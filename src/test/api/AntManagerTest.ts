import { AntModelManager } from '../../api/AntModelManager';
import { IAntConfig } from '../../api/config/IAntConfig';
import { IAntModelConfig } from '../../api/config/IAntModelConfig';
import { Model } from '../../model/Model';
import { ITest } from '../ITest';
import { RedisWrapper } from '../primary/RedisWrapper';
import { MinimalAntManager } from './MinimalAntManager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

const modelGenerator = (prefix: string) => new Model('id', {prefix: prefix});

export class AntManagerTest implements ITest {
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
    this._declareName = 'AntManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustGetAModelManager();
      this._itMustGetAndSetConfig();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    it(itsName, async (done) => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new MinimalAntManager();
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetAModelManager(): void {
    const itsName = 'mustGetAModelManager';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antManager = new MinimalAntManager();
      const config: IAntConfig<IAntModelConfig> = {
        default: {
          redis: this._redis.redis,
        },
      };
      antManager.config(config);
      expect(antManager.get(model) instanceof AntModelManager).toBe(true);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetAndSetConfig(): void {
    const itsName = 'mustGetAndSetConfig';
    it(itsName, async (done) => {
      const antManager = new MinimalAntManager();
      const config: IAntConfig<IAntModelConfig> = {
        default: {
          redis: this._redis.redis,
        },
      };
      expect(antManager.config(config).config()).toEqual(config);
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
