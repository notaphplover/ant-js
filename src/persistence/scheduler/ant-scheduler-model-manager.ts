import { MultipleQueryResult, SingleQueryResult, TMQuery, TQuery } from '../primary/query/query-types';
import { AntJsDeleteOptions } from '../options/antjs-delete-options';
import { AntJsSearchOptions } from '../options/antjs-search-options';
import { AntMultipleResultPrimaryQueryManager } from '../primary/query/ant-multiple-result-primary-query-manager';
import { AntSingleResultPrimaryQueryManager } from '../primary/query/ant-single-result-primary-query-manager';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { MultipleResultPrimaryQueryManager } from '../primary/query/multiple-result-primary-query-manager';
import { PersistencyDeleteOptions } from '../options/persistency-delete-options';
import { PersistencySearchOptions } from '../options/persistency-search-options';
import { PrimaryModelManager } from '../primary/primary-model-manager';
import { RedisMiddleware } from '../primary/redis-middleware';
import { SchedulerModelManager } from './scheduler-model-manager';
import { SecondaryEntityManager } from '../secondary/secondary-entity-manager';
import { SingleResultPrimaryQueryManager } from '../primary/query/single-result-primary-query-manager';

export class AntSchedulerModelManager<
  TEntity extends Entity,
  TModel extends Model<TEntity>,
  TPrimaryManager extends PrimaryModelManager<TEntity>,
  TSecondaryManager extends SecondaryEntityManager<TEntity>
> implements SchedulerModelManager<TEntity> {
  /**
   * Manager's model.
   */
  protected _model: TModel;
  /**
   * Primary manager
   */
  protected _primaryManager: TPrimaryManager;

  /**
   * Secondary manager
   */
  protected _secondaryManager: TSecondaryManager;

  public constructor(model: TModel, primaryManager: TPrimaryManager, secondaryManager?: TSecondaryManager) {
    this._model = model;
    this._primaryManager = primaryManager;
    this._secondaryManager = secondaryManager ?? null;
  }

  /**
   * @inheritdoc
   */
  public addMultipleResultQuery<TResult extends MultipleQueryResult>(
    query: TQuery<TResult>,
    redis: RedisMiddleware,
    reverseHashKey: string,
    queryKeyGen: (params: any) => string,
    entityKeyGen: (entity: TEntity) => string,
    mquery: TMQuery<TResult>,
  ): MultipleResultPrimaryQueryManager<TEntity> {
    const queryManager = new AntMultipleResultPrimaryQueryManager(
      this._model,
      this,
      query,
      redis,
      reverseHashKey,
      queryKeyGen,
      entityKeyGen,
      mquery,
    );
    this._primaryManager.addQuery(queryManager);
    return queryManager;
  }

  /**
   * @inheritdoc
   */
  public addSingleResultQuery<TResult extends SingleQueryResult>(
    query: TQuery<TResult>,
    redis: RedisMiddleware,
    reverseHashKey: string,
    queryKeyGen: (params: any) => string,
    entityKeyGen: (entity: TEntity) => string,
    mquery: TMQuery<TResult>,
  ): SingleResultPrimaryQueryManager<TEntity> {
    const queryManager = new AntSingleResultPrimaryQueryManager(
      this._model,
      this,
      query,
      redis,
      reverseHashKey,
      queryKeyGen,
      entityKeyGen,
      mquery,
    );
    this._primaryManager.addQuery(queryManager);
    return queryManager;
  }

  /**
   * @inheritdoc
   */
  public async delete(id: number | string, options?: Partial<PersistencyDeleteOptions>): Promise<any> {
    const deleteOptions = new AntJsDeleteOptions(options);
    if (null != this._secondaryManager && !deleteOptions.ignoreSecondaryLayer) {
      await this._secondaryManager.delete(id);
    }
    if (deleteOptions.ignorePrimaryLayer) {
      return Promise.resolve();
    } else {
      return this._primaryManager.delete(id);
    }
  }

  /**
   * @inheritdoc
   */
  public async get(id: string | number, options?: Partial<PersistencySearchOptions>): Promise<TEntity> {
    const searchOptions = new AntJsSearchOptions(options);

    let entity: TEntity;

    if (!searchOptions.ignorePrimaryLayer) {
      entity = await this._primaryManager.get(id);
    }

    if (undefined === entity && null != this._secondaryManager && !searchOptions.ignoreSecondaryLayer) {
      entity = await this._secondaryManager.getById(id);
      if (!searchOptions.ignorePrimaryLayer) {
        await this._primaryManager.cacheMiss(id, entity, searchOptions);
      }
    }

    if (undefined === entity) {
      entity = null;
    }

    return entity;
  }

  /**
   * @inheritdoc
   */
  public async mDelete(ids: number[] | string[], options?: Partial<PersistencyDeleteOptions>): Promise<any> {
    const deleteOptions = new AntJsDeleteOptions(options);
    if (null != this._secondaryManager && !deleteOptions.ignoreSecondaryLayer) {
      await this._secondaryManager.mDelete(ids);
    }
    if (deleteOptions.ignorePrimaryLayer) {
      return Promise.resolve();
    } else {
      return this._primaryManager.mDelete(ids);
    }
  }

  /**
   * @inheritdoc
   */
  public async mGet(ids: number[] | string[], options?: Partial<PersistencySearchOptions>): Promise<TEntity[]> {
    const searchOptions = new AntJsSearchOptions(options);

    // Get the different ones.
    ids = Array.from(new Set<number | string>(ids)) as number[] | string[];

    if (searchOptions.ignorePrimaryLayer) {
      return this._mGetIgnoringPrimary(ids, searchOptions);
    }

    const entities = await this._primaryManager.mGet(ids);

    if (null == this._secondaryManager || searchOptions.ignoreSecondaryLayer) {
      return this._mGetIgnoringSecondary(entities);
    }

    const missingIds = this._mGetGetMissingIds(ids, entities);

    if (0 === missingIds.length) {
      return this._mGetIgnoringSecondary(entities);
    }

    let missingEntities: TEntity[];

    if (this._primaryManager.negativeCache) {
      missingEntities = await this._mGetGetMissingEntitiesAndCacheMissesWithNegativeStrategy(missingIds, searchOptions);
    } else {
      missingEntities = await this._secondaryManager.getByIds(missingIds);
      await this._primaryManager.cacheMisses(missingIds, missingEntities, searchOptions);
    }

    return this._mGetBuildResultArray(entities, missingEntities, missingIds);
  }

  /**
   * Builds a result array mixing entities obtained from both primary and secondary layers.
   * @param entities Entities obtained from the primary layer.
   * @param missingEntities Entities obtained from the secondary layer.
   * @param missingIds Missing ids from the primary layer.
   * @returns Result array generated.
   */
  private _mGetBuildResultArray(
    entities: TEntity[],
    missingEntities: TEntity[],
    missingIds: number[] | string[],
  ): TEntity[] {
    const results = new Array(entities.length - missingIds.length + missingEntities.length);
    let counter = 0;
    for (const entity of entities) {
      if (null != entity) {
        results[counter++] = entity;
      }
    }
    for (const entity of missingEntities) {
      results[counter++] = entity;
    }
    return results;
  }

  /**
   * Gets missing entites from the secondary layer and permorms cache operations at the primary layer.
   * @param missingIds Missing ids from the primary layer.
   * @param options Search options.
   * @returns Missing entities from the secondary layer.
   */
  private async _mGetGetMissingEntitiesAndCacheMissesWithNegativeStrategy(
    missingIds: number[] | string[],
    options: PersistencySearchOptions,
  ): Promise<TEntity[]> {
    const missingEntities = await this._secondaryManager.getByIdsOrderedAsc(missingIds);

    const sortedIds =
      'number' === typeof missingIds[0]
        ? (missingIds as number[]).sort((a: number, b: number) => a - b)
        : missingIds.sort();

    await this._primaryManager.cacheMisses(sortedIds, missingEntities, options);
    return missingEntities;
  }

  /**
   * Gets the missing ids given a set of requested ids and a set of entities found.
   * @param ids Requested ids to the primary layer.
   * @param entities Entities found.
   */
  private _mGetGetMissingIds(ids: number[] | string[], entities: TEntity[]): number[] | string[] {
    const missingIds: number[] | string[] = new Array();
    for (let i = 0; i < entities.length; ++i) {
      if (undefined === entities[i]) {
        (missingIds as Array<number | string>).push(ids[i]);
      }
    }
    return missingIds;
  }

  /**
   * Gets entities by ids ignoring the primary layer.
   * @param ids Entity's ids.
   * @param options Search options.
   * @returns Entities found.
   */
  private _mGetIgnoringPrimary(ids: number[] | string[], options: PersistencySearchOptions): Promise<TEntity[]> {
    return null == this._secondaryManager || options.ignoreSecondaryLayer
      ? Promise.resolve(new Array())
      : this._secondaryManager.getByIds(ids);
  }

  /**
   * Filters entities from the output of the primary layer
   * @param entities Entities found at primary layer.
   * @returns Filtered entities.
   */
  private _mGetIgnoringSecondary(entities: TEntity[]): TEntity[] {
    const results = new Array();
    for (const entity of entities) {
      if (null != entity) {
        results.push(entity);
      }
    }
    return results;
  }
}
