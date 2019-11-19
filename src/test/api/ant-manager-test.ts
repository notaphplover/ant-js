import { AntModelManager } from '../../api/ant-model-manager';
import { ApiGeneralConfig } from '../../api/config/api-general-config';
import { ApiModelConfig } from '../../api/config/api-model-config';
import { AntModel } from '../../model/ant-model';
import { Entity } from '../../model/entity';
import { Test } from '../../testapi/api/test';
import { RedisWrapper } from '../primary/redis-wrapper';
import { MinimalAntManager } from './minimal-ant-manager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

const modelGenerator = (prefix: string): AntModel<Entity> => new AntModel('id', { prefix });

export class AntManagerTest implements Test {
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
      this._itMustGetAModelManagerWithoutConfig();
      this._itMustGetAnExistingModelManager();
      this._itMustGetAndSetConfig();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    it(
      itsName,
      async (done) => {
        expect(() => {
          // tslint:disable-next-line:no-unused-expression
          new MinimalAntManager();
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAModelManager(): void {
    const itsName = 'mustGetAModelManager';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antManager = new MinimalAntManager();
        const config: ApiGeneralConfig<ApiModelConfig> = {
          default: {
            redis: this._redis.redis,
          },
        };
        antManager.config(config);
        expect(antManager.get(model) instanceof AntModelManager).toBe(true);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAModelManagerWithoutConfig(): void {
    const itsName = 'mustGetAModelManagerWithoutConfig';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antManager = new MinimalAntManager();
        const antModelManager = antManager.get(model);
        expect(antModelManager.config()).toBeUndefined();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAnExistingModelManager(): void {
    const itsName = 'mustGetAnExistingModelManager';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antManager = new MinimalAntManager();
        const config: ApiGeneralConfig<ApiModelConfig> = {
          default: {
            redis: this._redis.redis,
          },
        };
        antManager.config(config);
        const antModelManager = antManager.get(model);
        expect(antManager.get(model)).toBe(antModelManager);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAndSetConfig(): void {
    const itsName = 'mustGetAndSetConfig';
    it(
      itsName,
      async (done) => {
        const antManager = new MinimalAntManager();
        const config: ApiGeneralConfig<ApiModelConfig> = {
          default: {
            redis: this._redis.redis,
          },
        };
        expect(antManager.config(config).config()).toEqual(config);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
