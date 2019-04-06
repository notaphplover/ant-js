import { IAntQueryConfig } from '../../api/IAntQueryConfig';
import { IEntity } from '../../model/IEntity';
import { Model } from '../../model/Model';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { ITest } from '../ITest';
import { RedisWrapper } from '../primary/RedisWrapper';
import { MinimalAntModelManager } from './MinimalAntModelManager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

const modelGenerator = (prefix: string) => new Model('id', {prefix: prefix});

type EntityTest = {id: number} & IEntity;

export class AntModelManagerTest implements ITest {
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
    this._declareName = 'AntModelManagerTest';
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustBeInitializable();
      this._itMustCallModelManagerMethods();
      this._itMustGetAndSetConfig();
      this._itMustGetAndSetMultipleResultQuery();
      this._itMustGetAndSetSingleResultQuery();
      this._itMustNotSetConfigIfConfigAlreadyExists();
      this._itMustNotSetQueryIfQueryOfADifferentModelAlreadyExists();
      this._itMustNotSetQueryIfQueryOfTheSameModelAlreadyExists();
      this._itMustReturnUndefinedIfTheAliasDoesNotExist();
      this._itMustThrowAnErrorIfConfigIsNotSet();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new MinimalAntModelManager(model, new Map());
      }).not.toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustCallModelManagerMethods(): void {
    const itsName = 'mustCallModelManagerMethods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      antModelManager.config({
        redis: this._redis.redis,
      });
      const modelManager = antModelManager.modelManager;
      const methodsToTest = [
        'delete',
        'get',
        'mDelete',
        'mGet',
        'mUpdate',
        'update',
      ] as Array<keyof IModelManager<any>>;

      for (const methodToTest of methodsToTest) {
        spyOn(modelManager, methodToTest).and.returnValue(methodToTest);
      }

      const entity: EntityTest = { id: 0 };

      const [
        deleteResult,
        getResult,
        mDeleteResult,
        mGetResult,
        mUpdateResult,
        updateResult,
      ] = await Promise.all([
        antModelManager.delete(entity),
        antModelManager.get(entity.id),
        antModelManager.mDelete([entity]),
        antModelManager.mGet([entity.id]),
        antModelManager.mUpdate([entity]),
        antModelManager.update(entity),
      ]);

      const results: {[key: string]: any} = {
        delete: deleteResult,
        get: getResult,
        mDelete: mDeleteResult,
        mGet: mGetResult,
        mUpdate: mUpdateResult,
        update: updateResult,
      };

      for (const methodToTest of methodsToTest) {
        expect(modelManager[methodToTest]).toHaveBeenCalled();
        expect(results[methodToTest]).toBe(methodToTest);
      }

      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetAndSetConfig(): void {
    const itsName = 'mustGetAndSetConfig';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);

      expect(antModelManager.config()).toEqual(config);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetAndSetMultipleResultQuery(): void {
    const itsName = 'mustGetAndSetMultipleResultQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);

      const queryConfig = {
        isMultiple: true,
        keyGen: (params: any) => prefix + 'query/' + params.field,
        query: (params: any) =>
          new Promise<number[]>((resolve) => resolve(
            (antModelManager.secondaryModelManager.store as Array<{ id: number, field: string}>).filter(
              (entity) => params.field === entity.field,
            ).map((entity) => entity.id),
          )),
        reverseHashKey: prefix + 'query/reverse',
      };
      const queryAlias = 'query-alias';
      const queryManager = antModelManager.query(queryConfig, queryAlias);
      expect(antModelManager.query(queryAlias)).toEqual(queryManager);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustGetAndSetSingleResultQuery(): void {
    const itsName = 'mustGetAndSetSingleResultQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);

      const queryConfig = {
        isMultiple: false,
        keyGen: (params: any) => prefix + 'query/' + params.field,
        query: (params: any) =>
          new Promise<number>((resolve) => {
            const entity = (antModelManager.secondaryModelManager.store as Array<{ id: number, field: string}>).find(
              (entity) => params.field === entity.field,
            );
            resolve(entity ? entity.id : null);
        }),
        reverseHashKey: prefix + 'query/reverse',
      };
      const queryAlias = 'query-alias';
      const queryManager = antModelManager.query(queryConfig, queryAlias);
      expect(antModelManager.query(queryAlias)).toEqual(queryManager);
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustNotSetConfigIfConfigAlreadyExists(): void {
    const itsName = 'mustNotSetConfigIfConfigAlreadyExists';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);

      expect(() => { antModelManager.config(config); }).toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustNotSetQueryIfQueryOfADifferentModelAlreadyExists(): void {
    const itsName = 'mustNotSetQueryIfQueryOfADifferentModelAlreadyExists';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const queriesMap = new Map();
      const queryAlias = 'query-alias';
      queriesMap.set(queryAlias, [{id: 'id'}, null]);
      const antModelManager = new MinimalAntModelManager(model, queriesMap);
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);

      const queryConfig = {
        isMultiple: true,
        keyGen: (params: any) => prefix + 'query/' + params.field,
        query: (params: any) =>
          new Promise<number[]>((resolve) => resolve(
            (antModelManager.secondaryModelManager.store as Array<{ id: number, field: string}>).filter(
              (entity) => params.field === entity.field,
            ).map((entity) => entity.id),
          )),
        reverseHashKey: prefix + 'query/reverse',
      };
      expect(() => {
        antModelManager.query(queryAlias);
      }).toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustNotSetQueryIfQueryOfTheSameModelAlreadyExists(): void {
    const itsName = 'mustNotSetQueryIfQueryAlreadyExists';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);

      const queryConfig = {
        isMultiple: true,
        keyGen: (params: any) => prefix + 'query/' + params.field,
        query: (params: any) =>
          new Promise<number[]>((resolve) => resolve(
            (antModelManager.secondaryModelManager.store as Array<{ id: number, field: string}>).filter(
              (entity) => params.field === entity.field,
            ).map((entity) => entity.id),
          )),
        reverseHashKey: prefix + 'query/reverse',
      };
      const queryAlias = 'query-alias';
      antModelManager.query(queryConfig, queryAlias);
      expect(() => {
        antModelManager.query(queryConfig, queryAlias);
      }).toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustReturnUndefinedIfTheAliasDoesNotExist(): void {
    const itsName = 'mustReturnUndefinedIfTheAliasDoesNotExist';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };
      antModelManager.config(config);
      expect(antModelManager.query('unexisting-alias')).toBeUndefined();
      done();
    }, MAX_SAFE_TIMEOUT);
  }

  private _itMustThrowAnErrorIfConfigIsNotSet(): void {
    const itsName = 'mustThrowAnErrorIfConfigIsNotSet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(itsName, async (done) => {
      const model = modelGenerator(prefix);
      const antModelManager = new MinimalAntModelManager(model, new Map());
      const config = {
        redis: this._redis.redis,
      };

      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        antModelManager.primaryEntityManager;
      }).toThrowError();
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        antModelManager.modelManager;
      }).toThrowError();
      done();
    }, MAX_SAFE_TIMEOUT);
  }
}
