import * as _ from 'lodash';
import { AntModel } from '../../model/ant-model';
import { AntQueryManager } from '../../api/query/ant-query-manager';
import { Entity } from '../../model/entity';
import { MinimalAntModelManager } from './minimal-ant-model-manager';
import { Model } from '../../model/model';
import { RedisWrapper } from '../primary/redis-wrapper';
import { SchedulerModelManager } from '../../persistence/scheduler/scheduler-model-manager';
import { Test } from '../../testapi/api/test';
import { iterableFilter } from '../util/iterable-filter';
import { iterableFind } from '../util/iterable-find';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

const modelGenerator = (prefix: string): AntModel<Entity> => new AntModel('id', { prefix });

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
        const modelManager = antModelManager.scheduledManager;

        const methodsToTest: Array<keyof SchedulerModelManager<any, Model<any>>> = [
          'delete',
          'get',
          'mDelete',
          'mGet',
        ];

        for (const methodToTest of methodsToTest) {
          spyOn(modelManager, methodToTest as any).and.returnValue(methodToTest as any);
        }

        const entity: EntityTest = { id: 0 };

        const [deleteResult, getResult, mDeleteResult, mGetResult] = await Promise.all([
          antModelManager.delete(entity.id),
          antModelManager.get(entity.id),
          antModelManager.mDelete([entity.id]),
          antModelManager.mGet([entity.id]),
        ]);

        const results: { [key: string]: any } = {
          delete: deleteResult,
          get: getResult,
          mDelete: mDeleteResult,
          mGet: mGetResult,
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
          query: (params: any): Promise<number[]> =>
            Promise.resolve(
              _.map(
                iterableFilter(
                  antModelManager.secondaryManager.store.values(),
                  (entity) => params.field === entity.field,
                ),
                (entity) => entity.id,
              ),
            ),
          queryKeyGen: (params: any): string => prefix + 'query/' + params.field,
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
          query: (params: any): Promise<number> => {
            const entity = iterableFind(
              antModelManager.secondaryManager.store.values(),
              (entity) => params.field === entity.field,
            );
            return Promise.resolve(entity ? entity[model.id] : null);
          },
          queryKeyGen: (params: any): string => prefix + 'query/' + params.field,
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
          query: (params: any): Promise<number> => {
            const entity = iterableFind(
              antModelManager.secondaryManager.store.values(),
              (entity) => params.field === entity.field,
            );
            return Promise.resolve(entity ? entity[model.id] : null);
          },
          queryKeyGen: (params: any): string => prefix + 'query/' + params.field,
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
        expect(() => antModelManager.scheduledManager).toThrowError();
        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
