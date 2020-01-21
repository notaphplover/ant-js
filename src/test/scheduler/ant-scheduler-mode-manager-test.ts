import { AntJsModelManagerGenerator } from '../../testapi/api/generator/antjs-model-manager-generator';
import { AntModel } from '../../model/ant-model';
import { AntScheduleModelManager } from '../../persistence/scheduler/ant-scheduler-model-manager';
import { Entity } from '../../model/entity';
import { PrimaryModelManager } from '../../persistence/primary/primary-model-manager';
import { RedisWrapper } from '../primary/redis-wrapper';
import { SecondaryEntityManager } from '../../persistence/secondary/secondary-entity-manager';
import { Test } from '../../testapi/api/test';

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

export class AntSchedulerModelManagerTest implements Test {
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
  protected _modelManagerGenerator: AntJsModelManagerGenerator;

  public constructor(beforeAllPromise: Promise<any>) {
    this._beforeAllPromise = beforeAllPromise;
    this._declareName = AntSchedulerModelManagerTest.name;
    this._modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
  }

  public performTests(): void {
    describe(this._declareName, () => {
      this._itMustCallPrimaryManagerMethods();
      this._itMustCallPrimaryManagerMethodsEvenIfNoSecondaryManagerIsProvided();
      this._itMustCallSecondaryManagerMethods();
    });
  }

  private _itMustCallPrimaryManagerMethods(): void {
    const itsName = 'must call primary manager methods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = new AntModel('id', { prefix });
        const [primaryManager, secondaryManager] = this._modelManagerGenerator.generateModelManager({ model });
        const schedulerModelManager = new AntScheduleModelManager(model, primaryManager, secondaryManager);

        const methodsToTestAtPrimary: Array<keyof PrimaryModelManager<any>> = ['delete', 'get', 'mDelete', 'mGet'];
        for (const methodToTest of methodsToTestAtPrimary) {
          spyOn(primaryManager, methodToTest as any).and.returnValue(Promise.resolve(methodToTest) as any);
        }

        const entity: Entity = { id: 0 };

        const [deleteResult, getResult, mDeleteResult, mGetResult] = await Promise.all([
          schedulerModelManager.delete(entity.id),
          schedulerModelManager.get(entity.id),
          schedulerModelManager.mDelete([entity.id]),
          schedulerModelManager.mGet([entity.id]),
        ]);

        const results: { [key: string]: any } = {
          delete: deleteResult,
          get: getResult,
          mDelete: mDeleteResult,
          mGet: mGetResult,
        };

        for (const methodToTest of methodsToTestAtPrimary) {
          expect(primaryManager[methodToTest]).toHaveBeenCalled();
          expect(results[methodToTest]).toBe(methodToTest);
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCallPrimaryManagerMethodsEvenIfNoSecondaryManagerIsProvided(): void {
    const itsName = 'must call primary manager methods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = new AntModel('id', { prefix });
        const [primaryManager] = this._modelManagerGenerator.generateModelManager({ model });
        const schedulerModelManager = new AntScheduleModelManager(model, primaryManager);

        const methodsToTestAtPrimary: Array<keyof PrimaryModelManager<any>> = ['delete', 'get', 'mDelete', 'mGet'];
        for (const methodToTest of methodsToTestAtPrimary) {
          spyOn(primaryManager, methodToTest as any).and.returnValue(Promise.resolve(methodToTest) as any);
        }

        const entity: Entity = { id: 0 };

        const [deleteResult, getResult, mDeleteResult, mGetResult] = await Promise.all([
          schedulerModelManager.delete(entity.id),
          schedulerModelManager.get(entity.id),
          schedulerModelManager.mDelete([entity.id]),
          schedulerModelManager.mGet([entity.id]),
        ]);

        const results: { [key: string]: any } = {
          delete: deleteResult,
          get: getResult,
          mDelete: mDeleteResult,
          mGet: mGetResult,
        };

        for (const methodToTest of methodsToTestAtPrimary) {
          expect(primaryManager[methodToTest]).toHaveBeenCalled();
          expect(results[methodToTest]).toBe(methodToTest);
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCallSecondaryManagerMethods(): void {
    const itsName = 'must call secondary manager methods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = new AntModel('id', { prefix });
        const [primaryManager, secondaryManager] = this._modelManagerGenerator.generateModelManager({ model });
        const schedulerModelManager = new AntScheduleModelManager(model, primaryManager, secondaryManager);

        const methodsToTestAtPrimary: Array<keyof SecondaryEntityManager<any>> = [
          'delete',
          'getById',
          'getByIds',
          'mDelete',
        ];
        for (const methodToTest of methodsToTestAtPrimary) {
          spyOn(secondaryManager, methodToTest as any).and.callThrough();
        }

        const entity: Entity = { id: 0 };

        await Promise.all([
          schedulerModelManager.delete(entity.id),
          schedulerModelManager.get(entity.id),
          schedulerModelManager.mDelete([entity.id]),
          schedulerModelManager.mGet([entity.id]),
        ]);
        for (const methodToTest of methodsToTestAtPrimary) {
          expect(secondaryManager[methodToTest]).toHaveBeenCalled();
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
