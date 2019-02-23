import { IEntity } from '../../model/IEntity';
import { ITest } from '../ITest';
import { MinimunModel } from '../model/MinimunModel';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';
import { MinimunPrimaryModelManager } from './MinimunPrimaryModelManager';
import { RedisWrapper } from './RedisWrapper';

export class PrimaryModelManagerTest implements ITest {
  /**
   * Redis Wrapper
   */
  protected _redis: RedisWrapper;

  public constructor() {
    this._redis = new RedisWrapper();
  }

  public performTests(): void {
    describe('PrimaryModelManagerTest', () => {
      this.itMustBeInitializable();
      this.itMustPersistAnEntity();
    });
  }

  private itMustBeInitializable(): void {
    it('mustBeInitializable', () => {
      expect(() => {
        const model = new MinimunModel('id', ['id']);
        const secondaryModelManager =
          new SecondaryModelManagerMock<MinimunModel, {id: string}>(model);
        // tslint:disable-next-line:no-unused-expression
        new MinimunPrimaryModelManager(this._redis.redis, secondaryModelManager, 'sample-prefix');
      }).not.toThrowError();
    });
  }

  private itMustPersistAnEntity(): void {
    it('mustPersistAnEntity', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const entity: IEntity & {
        id: number,
        field: string,
      } = {id: 0, field: 'sample'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity]);
      const primaryModelManager =
        new MinimunPrimaryModelManager(this._redis.redis, secondaryModelManager, 'sample-prefix');

      await this._redis.redis.flushall();
      await primaryModelManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      const entityFound = await primaryModelManager.getById(entity[model.id]);
      expect(entityFound).toEqual(entity);
      done();
    });
  }
}
