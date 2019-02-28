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
      this.itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided();
      this.itDoesNotCacheEntitiesIfNoCacheOptionIsProvided();
      this.itDoesNotCacheEntityIfNoCacheOptionIsProvided();
      this.itDoesNotSupportCacheIfNotExiststCacheEntities();
      this.itDoesNotSupportTTLAtCacheEntities();
      this.itDoesNotSupportUndefinedCacheOptionAtCacheEntities();
      this.itDoesNotSupportUndefinedCacheOptionAtCacheEntity();
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

  private itDoesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided(): void {
    it('doesNotCacheIfCacheExistsAndCacheIfNotExistsIsProvided', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};
      const entity1Modified: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-modified'};

      await this._redis.redis.flushall();

      await primaryModelManager.cacheEntity(entity1);
      await primaryModelManager.cacheEntity(
        entity1Modified,
        new EntitySearchOptions(CacheOptions.CacheIfNotExist),
      );
      expect(await primaryModelManager.getById(entity1Modified[model.id])).toEqual(entity1);
      done();
    });
  }

  private itDoesNotCacheEntitiesIfNoCacheOptionIsProvided(): void {
    it('doesNoCacheIfNoCacheOptionIsProvided', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await this._redis.redis.flushall();

      await primaryModelManager.cacheEntities(
        [entity1],
        new EntitySearchOptions(CacheOptions.NoCache),
      );

      expect(await primaryModelManager.getById(entity1[model.id]))
        .toBe(undefined);
      done();
    });
  }

  private itDoesNotCacheEntityIfNoCacheOptionIsProvided(): void {
    it('doesNoCacheIfNoCacheOptionIsProvided', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
      );
      const entity1: IEntity & {
        id: number,
        field: string,
      } = {id: 1, field: 'sample-1'};

      await this._redis.redis.flushall();

      await primaryModelManager.cacheEntity(
        entity1,
        new EntitySearchOptions(CacheOptions.NoCache),
      );

      expect(await primaryModelManager.getById(entity1[model.id]))
        .toBe(undefined);
      done();
    });
  }

  private itDoesNotSupportCacheIfNotExiststCacheEntities(): void {
    it('doesNotSupportCacheIfNotExiststCacheEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
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

  private itDoesNotSupportTTLAtCacheEntities(): void {
    it('doesNotSupportTTLAtCacheEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
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

  private itDoesNotSupportUndefinedCacheOptionAtCacheEntities() {
    it('doesNotSupportUndefinedCacheOptionAtCacheEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
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
          new EntitySearchOptions('Ohhh yeaaaahh!' as unknown as CacheOptions),
        );
        fail();
      } catch {
        done();
      }
    });
  }

  private itDoesNotSupportUndefinedCacheOptionAtCacheEntity() {
    it('doesNotSupportUndefinedCacheOptionAtCacheEntity', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
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
        await primaryModelManager.cacheEntity(
          entity1,
          new EntitySearchOptions('Ohhh yeaaaahh!' as unknown as CacheOptions),
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
        const model = new MinimunModel('id', ['id'], {prefix: 'p/'});
        const secondaryModelManager =
          new SecondaryModelManagerMock<MinimunModel, {id: string}>(model);
        // tslint:disable-next-line:no-unused-expression
        new MinimunPrimaryModelManager(
          model,
          this._redis.redis,
          secondaryModelManager,
        );
      }).not.toThrowError();
    });
  }

  private itMustDeleteAnEntity(): void {
    it('mustDeleteAnEntity', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
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
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
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
      );

      await this._redis.redis.flushall();
      const entityFound = await primaryModelManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    });
  }

  private itMustFindMultipleEntitiesOutsideCache(): void {
    it('mustFindMultipleEntitiesOutsideCache', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
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

  private itMustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails(): void {
    it('mustFindUndefinedIfNoSuccessorIsProvidedAndCacheFails', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        null,
      );
      const idToSearch = 3;

      await this._redis.redis.flushall();

      expect(await primaryModelManager.getById(idToSearch)).toBeUndefined();
      done();
    });
  }

  private itMustFindZeroEntities(): void {
    it('itMustFindZeroEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model);

      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      expect(async () => {
        await primaryModelManager.getByIds(new Array());
      }).not.toThrowError();
      done();
    });
  }

  private itMustPersistAnEntity(): void {
    it('mustPersistAnEntity', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
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
      );

      await this._redis.redis.flushall();
      await primaryModelManager.cacheEntity(entity);
      secondaryModelManager.store.length = 0;
      const entityFound = await primaryModelManager.getById(entity[model.id]);

      expect(entityFound).toEqual(entity);
      done();
    });
  }

  private itMustPersistMultipleEntities(): void {
    it('mustPersistMultipleEntities', async (done) => {
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
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
      const model = new MinimunModel('id', ['id', 'field'], {prefix: 'p/'});
      const secondaryModelManager =
        new SecondaryModelManagerMock<MinimunModel, IEntity & {
          id: number,
          field: string,
        }>(model);

      const primaryModelManager = new MinimunPrimaryModelManager(
        model,
        this._redis.redis,
        secondaryModelManager,
      );

      expect(async () => {
        await primaryModelManager.cacheEntities(new Array());
      }).not.toThrowError();
      done();
    });
  }
}
