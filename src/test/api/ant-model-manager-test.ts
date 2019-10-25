import { AntQueryManager } from '../../api/query/ant-query-manager';
import { AntModel } from '../../model/ant-model';
import { Entity } from '../../model/entity';
import { PrimaryModelManager } from '../../persistence/primary/primary-model-manager';
import { Test } from '../../testapi/api/test';
import { RedisWrapper } from '../primary/redis-wrapper';
import { MinimalAntModelManager } from './minimal-ant-model-manager';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

const modelGenerator = (prefix: string) => new AntModel('id', { prefix: prefix });

type EntityTest = { id: number } & Entity;

export class AntModelManagerTest implements Test {
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
      this._itMustSetAQueryWithoutAlias();
      this._itMustNotSetConfigIfConfigAlreadyExists();
      this._itMustThrowAnErrorIfConfigIsNotSet();
    });
  }

  private _itMustBeInitializable(): void {
    const itsName = 'mustBeInitializable';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        expect(() => {
          // tslint:disable-next-line:no-unused-expression
          new MinimalAntModelManager(model);
        }).not.toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCallModelManagerMethods(): void {
    const itsName = 'mustCallModelManagerMethods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        antModelManager.config({
          redis: this._redis.redis,
        });
        const modelManager = antModelManager.modelManager;

        const methodsToTest = ['delete', 'get', 'mDelete', 'mGet', 'mUpdate', 'update'] as Array<
          keyof PrimaryModelManager<any>
        >;

        for (const methodToTest of methodsToTest) {
          spyOn(modelManager, methodToTest as any).and.returnValue(methodToTest as any);
        }

        const entity: EntityTest = { id: 0 };

        const [deleteResult, getResult, mDeleteResult, mGetResult, mUpdateResult, updateResult] = await Promise.all([
          antModelManager.delete(entity.id),
          antModelManager.get(entity.id),
          antModelManager.mDelete([entity.id]),
          antModelManager.mGet([entity.id]),
          antModelManager.mUpdate([entity]),
          antModelManager.update(entity),
        ]);

        const results: { [key: string]: any } = {
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
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAndSetConfig(): void {
    const itsName = 'mustGetAndSetConfig';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        const config = {
          redis: this._redis.redis,
        };
        antModelManager.config(config);

        expect(antModelManager.config()).toEqual(config);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAndSetMultipleResultQuery(): void {
    const itsName = 'mustGetAndSetMultipleResultQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        const config = {
          redis: this._redis.redis,
        };
        antModelManager.config(config);

        const queryConfig = {
          isMultiple: true,
          query: (params: any) =>
            new Promise<number[]>((resolve) =>
              resolve(
                (antModelManager.secondaryModelManager.store as Array<{ id: number; field: string }>)
                  .filter((entity) => params.field === entity.field)
                  .map((entity) => entity.id),
              ),
            ),
          queryKeyGen: (params: any) => prefix + 'query/' + params.field,
          reverseHashKey: prefix + 'query/reverse',
        };
        const queryManager = antModelManager.query(queryConfig);
        expect(queryManager.get instanceof Function).toBe(true);
        expect(queryManager.mGet instanceof Function).toBe(true);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustGetAndSetSingleResultQuery(): void {
    const itsName = 'mustGetAndSetSingleResultQuery';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        const config = {
          redis: this._redis.redis,
        };
        antModelManager.config(config);

        const queryConfig = {
          isMultiple: false,
          query: (params: any) =>
            new Promise<number>((resolve) => {
              const entity = (antModelManager.secondaryModelManager.store as Array<{ id: number; field: string }>).find(
                (entity) => params.field === entity.field,
              );
              resolve(entity ? entity.id : null);
            }),
          queryKeyGen: (params: any) => prefix + 'query/' + params.field,
          reverseHashKey: prefix + 'query/reverse',
        };

        const queryManager = antModelManager.query(queryConfig);
        expect(queryManager.get instanceof Function).toBe(true);
        expect(queryManager.mGet instanceof Function).toBe(true);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustSetAQueryWithoutAlias(): void {
    const itsName = 'mustSetAQueryWithoutAlias';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        const config = {
          redis: this._redis.redis,
        };
        antModelManager.config(config);

        const queryConfig = {
          isMultiple: false,
          query: (params: any) =>
            new Promise<number>((resolve) => {
              const entity = (antModelManager.secondaryModelManager.store as Array<{ id: number; field: string }>).find(
                (entity) => params.field === entity.field,
              );
              resolve(entity ? entity.id : null);
            }),
          queryKeyGen: (params: any) => prefix + 'query/' + params.field,
          reverseHashKey: prefix + 'query/reverse',
        };
        const queryManager = antModelManager.query(queryConfig);
        expect(queryManager instanceof AntQueryManager).toBe(true);
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustNotSetConfigIfConfigAlreadyExists(): void {
    const itsName = 'mustNotSetConfigIfConfigAlreadyExists';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        const config = {
          redis: this._redis.redis,
        };
        antModelManager.config(config);

        expect(() => {
          antModelManager.config(config);
        }).toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustThrowAnErrorIfConfigIsNotSet(): void {
    const itsName = 'mustThrowAnErrorIfConfigIsNotSet';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = modelGenerator(prefix);
        const antModelManager = new MinimalAntModelManager(model);
        const config = {
          redis: this._redis.redis,
        };
        expect(() => {
          // tslint:disable-next-line:no-unused-expression
          antModelManager.modelManager;
        }).toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
