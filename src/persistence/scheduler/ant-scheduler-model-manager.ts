import { MultipleQueryResult, SingleQueryResult, TMQuery, TQuery } from '../primary/query/query-types';
import { AntMultipleResultPrimaryQueryManager } from '../primary/query/ant-multiple-result-primary-query-manager';
import { AntSingleResultPrimaryQueryManager } from '../primary/query/ant-single-result-primary-query-manager';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { MultipleResultPrimaryQueryManager } from '../primary/query/multiple-result-primary-query-manager';
import { PersistencyDeleteOptions } from '../primary/options/persistency-delete-options';
import { PersistencySearchOptions } from '../primary/options/persistency-search-options';
import { PrimaryModelManager } from '../primary/primary-model-manager';
import { RedisMiddleware } from '../primary/redis-middleware';
import { SchedulerModelManager } from './scheduler-model-manager';
import { SecondaryEntityManager } from '../secondary/secondary-entity-manager';
import { SingleResultPrimaryQueryManager } from '../primary/query/single-result-primary-query-manager';

export class AntScheduleModelManager<
  TEntity extends Entity,
  TModel extends Model<TEntity>,
  TPrimaryManager extends PrimaryModelManager<TEntity>,
  TSecondaryManager extends SecondaryEntityManager<TEntity>
> implements SchedulerModelManager<TEntity, TModel> {
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
      this._primaryManager,
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
      this._primaryManager,
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
    if (null != this._secondaryManager) {
      await this._secondaryManager.delete(id);
    }
    return this._primaryManager.delete(id, options);
  }

  /**
   * @inheritdoc
   */
  public get(id: string | number, options?: Partial<PersistencySearchOptions>): Promise<TEntity> {
    return this._primaryManager.get(id, options);
  }

  /**
   * @inheritdoc
   */
  public async mDelete(ids: number[] | string[], options?: Partial<PersistencyDeleteOptions>): Promise<any> {
    if (null != this._secondaryManager) {
      await this._secondaryManager.mDelete(ids);
    }
    return this._primaryManager.mDelete(ids, options);
  }

  /**
   * @inheritdoc
   */
  public mGet(ids: number[] | string[], options?: Partial<PersistencySearchOptions>): Promise<TEntity[]> {
    return this._primaryManager.mGet(ids, options);
  }
}
