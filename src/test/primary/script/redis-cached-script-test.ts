import { RedisCachedScript } from '../../../persistence/primary/script/redis-cached-script';
import { Test } from '../../../testapi/api/test';
import { RedisWrapper } from '../redis-wrapper';
import { MinimalRedisCachedScript } from './minimal-redis-cached-script';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class RedisCachedScriptTest implements Test {
  /**
   * Before all task performed promise.
   */
  protected _beforeAllPromise: Promise<any>;
  /**
   * Test name.
   */
  protected _declareName: string;
  /**
   * Redis wrapper.
   */
  protected _redis: RedisWrapper;

  /**
   * Creates a new test class for RedisCachedScript
   * @param beforeAllPromise Before all task performed promise.
   */
  public constructor(beforeAllPromise: Promise<any>) {
    this._beforeAllPromise = beforeAllPromise;
    this._declareName = RedisCachedScriptTest.name;
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustCacheAnScript();
      this._itMustEvalAnScript();
      this._itMustThrowScriptErrorsEvenIfCached();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        expect(() => {
          // tslint:disable-next-line:no-unused-expression
          new RedisCachedScript('return ARGV[0]', this._redis.redis);
        }).not.toThrowError();

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCacheAnScript(): void {
    const itsName = 'mustCacheAnScript';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const text = itsName;
        const script = `return '${text}'`;
        const cachedScript = new MinimalRedisCachedScript(script, this._redis.redis);
        const scriptExistenceBefore = await this._redis.redis.script('exists', cachedScript.sha);
        await cachedScript.eval((scriptArg) => [scriptArg, 0]);
        const scriptExistenceAfter = await this._redis.redis.script('exists', cachedScript.sha);

        expect(scriptExistenceBefore).toEqual([0]);
        expect(scriptExistenceAfter).toEqual([1]);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustEvalAnScript(): void {
    const itsName = 'mustEvalAnScript';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const text = itsName;
        const script = `return '${text}'`;
        const cachedScript = new RedisCachedScript(script, this._redis.redis);
        const result = await cachedScript.eval((scriptArg) => [scriptArg, 0]);

        expect(result).toBe(text);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustThrowScriptErrorsEvenIfCached(): void {
    const itsName = 'mustThrowScriptErrors';
    it(
      itsName,
      async (done) => {
        await this._beforeAllPromise;

        const script = `return missingVar`;
        const cachedScript = new RedisCachedScript(script, this._redis.redis);

        const evalPromise = cachedScript.eval((scriptArg) => [scriptArg, 0]);
        expectAsync(evalPromise).toBeRejected();
        expectAsync(evalPromise.catch(() => cachedScript.eval((scriptArg) => [scriptArg, 0]))).toBeRejected();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
