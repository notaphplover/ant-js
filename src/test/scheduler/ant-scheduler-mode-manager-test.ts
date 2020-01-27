import { AntJsModelManagerGenerator } from '../../testapi/api/generator/antjs-model-manager-generator';
import { AntModel } from '../../model/ant-model';
import { AntSchedulerModelManager } from '../../persistence/scheduler/ant-scheduler-model-manager';
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
      this._mustIgnorePrimaryLayerIfTheIgnoreFlagIsUpOnDeleteMethods();
      this._mustIgnoreSecondaryLayerIfTheIgnoreFlagIsUpOnDeleteMethods();
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
        const schedulerModelManager = new AntSchedulerModelManager(model, primaryManager, secondaryManager);

        const methodsToTest: Array<keyof PrimaryModelManager<any>> = ['delete', 'get', 'mDelete', 'mGet'];
        for (const methodToTest of methodsToTest) {
          spyOn(primaryManager, methodToTest as any).and.callThrough();
        }

        const entity: Entity = { id: 0 };

        await Promise.all([
          schedulerModelManager.delete(entity.id),
          schedulerModelManager.get(entity.id),
          schedulerModelManager.mDelete([entity.id]),
          schedulerModelManager.mGet([entity.id]),
        ]);

        for (const methodToTest of methodsToTest) {
          expect(primaryManager[methodToTest]).toHaveBeenCalled();
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _itMustCallPrimaryManagerMethodsEvenIfNoSecondaryManagerIsProvided(): void {
    const itsName = 'must call primary manager methods even if no secondary manager is provided';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = new AntModel('id', { prefix });
        const [primaryManager] = this._modelManagerGenerator.generateModelManager({ model });
        const schedulerModelManager = new AntSchedulerModelManager(model, primaryManager);

        const methodsToTest: Array<keyof PrimaryModelManager<any>> = ['delete', 'get', 'mDelete', 'mGet'];
        for (const methodToTest of methodsToTest) {
          spyOn(primaryManager, methodToTest as any).and.callThrough();
        }

        const entity: Entity = { id: 0 };

        await Promise.all([
          schedulerModelManager.delete(entity.id),
          schedulerModelManager.get(entity.id),
          schedulerModelManager.mDelete([entity.id]),
          schedulerModelManager.mGet([entity.id]),
        ]);

        for (const methodToTest of methodsToTest) {
          expect(primaryManager[methodToTest]).toHaveBeenCalled();
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
        const schedulerModelManager = new AntSchedulerModelManager(model, primaryManager, secondaryManager);

        const methodsToTest: Array<keyof SecondaryEntityManager<any>> = ['delete', 'getById', 'getByIds', 'mDelete'];
        for (const methodToTest of methodsToTest) {
          spyOn(secondaryManager, methodToTest as any).and.callThrough();
        }

        const entity: Entity = { id: 0 };

        await Promise.all([
          schedulerModelManager.delete(entity.id),
          schedulerModelManager.get(entity.id),
          schedulerModelManager.mDelete([entity.id]),
          schedulerModelManager.mGet([entity.id]),
        ]);
        for (const methodToTest of methodsToTest) {
          expect(secondaryManager[methodToTest]).toHaveBeenCalled();
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _mustIgnorePrimaryLayerIfTheIgnoreFlagIsUpOnDeleteMethods(): void {
    const itsName = 'must ignore primary layer if the ignore flag is up on delete methods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = new AntModel('id', { prefix });
        const [primaryManager, secondaryManager] = this._modelManagerGenerator.generateModelManager({ model });
        const schedulerModelManager = new AntSchedulerModelManager(model, primaryManager, secondaryManager);

        const methodsToTest: Array<keyof PrimaryModelManager<any>> = ['delete', 'mDelete'];
        for (const methodToTest of methodsToTest) {
          spyOn(primaryManager, methodToTest as any).and.callThrough();
        }

        const entity: Entity = { id: 0 };

        await Promise.all([
          schedulerModelManager.delete(entity.id, { ignorePrimaryLayer: true }),
          schedulerModelManager.mDelete([entity.id], { ignorePrimaryLayer: true }),
        ]);
        for (const methodToTest of methodsToTest) {
          expect(primaryManager[methodToTest]).not.toHaveBeenCalled();
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }

  private _mustIgnoreSecondaryLayerIfTheIgnoreFlagIsUpOnDeleteMethods(): void {
    const itsName = 'must ignore secondary layer if the ignore flag is up on delete methods';
    const prefix = this._declareName + '/' + itsName + '/';
    it(
      itsName,
      async (done) => {
        const model = new AntModel('id', { prefix });
        const [primaryManager, secondaryManager] = this._modelManagerGenerator.generateModelManager({ model });
        const schedulerModelManager = new AntSchedulerModelManager(model, primaryManager, secondaryManager);

        const methodsToTest: Array<keyof SecondaryEntityManager<any>> = ['delete', 'mDelete'];
        for (const methodToTest of methodsToTest) {
          spyOn(secondaryManager, methodToTest as any).and.callThrough();
        }

        const entity: Entity = { id: 0 };

        await Promise.all([
          schedulerModelManager.delete(entity.id, { ignoreSecondaryLayer: true }),
          schedulerModelManager.mDelete([entity.id], { ignoreSecondaryLayer: true }),
        ]);
        for (const methodToTest of methodsToTest) {
          expect(secondaryManager[methodToTest]).not.toHaveBeenCalled();
        }

        done();
      },
      MAX_SAFE_TIMEOUT,
    );
  }
}
