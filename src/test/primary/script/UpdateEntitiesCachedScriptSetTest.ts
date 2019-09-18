import { AntJsUpdateOptions } from '../../../persistence/primary/options/AntJsUpdateOptions';
import { RedisCachedScript } from '../../../persistence/primary/script/RedisCachedScript';
import { UpdateEntitiesCachedScriptSet } from '../../../persistence/primary/script/UpdateEntitiesCachedScriptSet';
import { ITest } from '../../../testapi/api/ITest';
import { RedisWrapper } from '../RedisWrapper';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class UpdateEntitiesCachedScriptSetTest implements ITest {

  protected _beforeAllPromise: Promise<any>;

  protected _declareName: string;

  protected _redis: RedisWrapper;

  public constructor(beforeAllPromise: Promise<any>) {
    this._beforeAllPromise = beforeAllPromise;
    this._declareName = UpdateEntitiesCachedScriptSetTest.name;
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustGenerateACachedScriptIfNotExists();
      this._itMustNotGenerateACachedScriptIfExists();
      this._itMustRequestCachedScriptToEval();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new UpdateEntitiesCachedScriptSet(
          () => new RedisCachedScript('return ARGV[0]', this._redis.redis),
        );
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGenerateACachedScriptIfNotExists(): void {
    const itsName = 'mustGenerateACachedScriptIfNotExists';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const generator = () => new RedisCachedScript('return 0', this._redis.redis);
      const generatorSpy = jasmine.createSpy(
        'generator',
        generator,
      ).and.callThrough();

      const cachedScriptSet = new UpdateEntitiesCachedScriptSet(
        generatorSpy,
      );

      await cachedScriptSet.eval(
        new AntJsUpdateOptions(),
        (scriptArg) => [scriptArg, 0],
      );

      expect(generatorSpy.calls.count()).toBe(1);

      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustNotGenerateACachedScriptIfExists(): void {
    const itsName = 'mustNotGenerateACachedScriptIfExists';
    it(itsName, async (done) => {
      await this._beforeAllPromise;
      const generator = () => new RedisCachedScript('return 0', this._redis.redis);
      const generatorSpy = jasmine.createSpy(
        'generator',
        generator,
      ).and.callThrough();

      const cachedScriptSet = new UpdateEntitiesCachedScriptSet(
        generatorSpy,
      );

      await cachedScriptSet.eval(
        new AntJsUpdateOptions(),
        (scriptArg) => [scriptArg, 0],
      );
      await cachedScriptSet.eval(
        new AntJsUpdateOptions(),
        (scriptArg) => [scriptArg, 0],
      );

      expect(generatorSpy.calls.count()).toBe(1);

      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustRequestCachedScriptToEval(): void {
    const itsName = 'mustRequestCachedScriptToEval';
    it(itsName, async (done) => {
      await this._beforeAllPromise;

      const cachedScript = new RedisCachedScript('return 0', this._redis.redis);
      spyOn(cachedScript, 'eval').and.callThrough();

      const generator = () => cachedScript;
      const cachedScriptSet = new UpdateEntitiesCachedScriptSet(
        generator,
      );

      await cachedScriptSet.eval(
        new AntJsUpdateOptions(),
        (scriptArg) => [scriptArg, 0],
      );

      expect(cachedScript.eval).toHaveBeenCalled();

      done();
    }, MAX_SAFE_TIMEOUT);
  }
}