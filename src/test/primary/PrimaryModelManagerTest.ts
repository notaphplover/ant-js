import { IEntity } from '../../model/IEntity';
import { CacheOptions } from '../../persistence/primary/CacheOptions';
import { EntitySearchOptions } from '../../persistence/primary/EntitySearchOptions';
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
      this.itDoesNotSupportCacheIfNotExiststCacheEntities();
      this.itDoesNotSupportTTLAtCacheEntities();
      this.itMustBeInitializable();
      this.itMustDeleteAnEntity();
      this.itMustFindAnEntityOutsideCache();
      this.itMustFindMultipleEntitiesOutsideCache();
      this.itMustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails();
      this.itMustFindZeroEntities();
      this.itMustPersistAnEntity();
      this.itMustPersistMultipleEntities();
      this.itMustPersistZeroEntities();
    });
  }

  private itDoesNotSupportCacheIfNotExiststCacheEntities() {
    it('doesNotSupportCacheIfNotExiststCacheEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
        'sample-prefix',
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryModelManager.cacheEntities(
          [entity1],
          new EntitySearchOptions(CacheOptions.CacheIfNotExist),
        );
        fail();
      } catch {
        done();
      }
    });
  }

  private itDoesNotSupportTTLAtCacheEntities() {
    it('doesNotSupportTTLAtCacheEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
        'sample-prefix',
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      /*
       * Expect async to throw error just sucks:
       * https://github.com/jasmine/jasmine/issues/1410
       */
      try {
        await primaryModelManager.cacheEntities(
          [entity1],
          new EntitySearchOptions(CacheOptions.CacheAndOverwrite, 2),
        );
        fail();
      } catch {
        done();
      }
    });
  }

  private itMustBeInitializable(): void {
    it('mustBeInitializable', () => {
      expect(() => {
        const model = new MinimunModel('id', ['id']);
        const secondaryModelManager =
          new SecondaryModelManagerMock<MinimunModel, {id: string}>(model);
        // tslint:disable-next-line:no-unused-expression
        new MinimunPrimaryModelManager(
          model,
          this._redis.redis,
          secondaryModelManager,
          'sample-prefix',
        );
      }).not.toThrowError();
    });
  }

  private itMustDeleteAnEntity(): void {
    it('mustDeleteAnEntity', async (done) => {
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
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      await this._redis.redis.flushall();
      await primaryModelManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      await primaryModelManager.deleteEntityFromCache(entity);
      const entityFound = await primaryModelManager.getById(entity[model.id]);

      expect(entityFound).not.toBeDefined();
      done();
    });
  }

  private itMustFindAnEntityOutsideCache(): void {
    it('mustFindAnEntityOutsideCache', async (done) => {
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
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      await this._redis.redis.flushall();
      const entityFound = await primaryModelManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    });
  }

  private itMustFindMultipleEntitiesOutsideCache(): void {
    it('mustFindMultipleEntitiesOutsideCache', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1, entity2]);

      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      await this._redis.redis.flushall();
      const entitiesFound = await primaryModelManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    });
  }

  private itMustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails() {
    it('mustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
        'sample-prefix',
      );
      const idToSearch = 3;

      await this._redis.redis.flushall();

      expect(await primaryModelManager.getById(idToSearch)).toBeUndefined();
      done();
    });
  }

  private itMustFindZeroEntities(): void {
    it('itMustFindZeroEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model);

      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      expect(async () => {
        await primaryModelManager.getByIds(new Array());
      }).not.toThrowError();
      done();
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
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      await this._redis.redis.flushall();
      await primaryModelManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      const entityFound = await primaryModelManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    });
  }

  private itMustPersistMultipleEntities() {
    it('mustPersistMultipleEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity2: IEntity & {
        id: number,
        field: string,
      } = {id: 2, field: 'sample-2'};
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model, [entity1, entity2]);

      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      await this._redis.redis.flushall();
      await primaryModelManager.cacheEntities([entity1, entity2]);
      secondaryModelManager.store.length = 0;
      const entitiesFound = await primaryModelManager.getByIds([
        entity1[model.id],
        entity2[model.id],
      ]);

      expect(entitiesFound).toContain(entity1);
      expect(entitiesFound).toContain(entity2);
      done();
    });
  }

  private itMustPersistZeroEntities(): void {
    it('mustPersistZeroEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field']);
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model);

      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
        'sample-prefix',
      );

      expect(async () => {
        await primaryModelManager.cacheEntities(new Array());
      }).not.toThrowError();
      done();
    });
  }
}
