import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PersistencyDeleteOptions } from '../primary/options/persistency-delete-options';
import { PersistencySearchOptions } from '../primary/options/persistency-search-options';
import { PrimaryModelManager } from '../primary/primary-model-manager';
import { PrimaryQueryManager } from '../primary/query/primary-query-manager';
import { SchedulerModelManager } from './scheduler-model-manager';
import { SecondaryEntityManager } from '../secondary/secondary-entity-manager';

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

  public constructor(model: TModel, primaryManager: TPrimaryManager, secondaryManager: TSecondaryManager) {
    this._model = model;
    this._primaryManager = primaryManager;
    this._secondaryManager = secondaryManager;
  }

  /**
   * @inheritdoc
   */
  public get model(): TModel {
    return this._model;
  }

  /**
   * Adds a query manager to the model manager.
   * @param queryManager Query manager to add.
   */
  public addQuery(queryManager: PrimaryQueryManager<TEntity>): this {
    this._primaryManager.addQuery(queryManager);
    return this;
  }

  /**
   * @inheritdoc
   */
  public async delete(id: number | string, options?: PersistencyDeleteOptions): Promise<any> {
    if (null != this._secondaryManager) {
      await this._secondaryManager.delete(id);
    }
    return this._primaryManager.delete(id, options);
  }

  /**
   * @inheritdoc
   */
  public get(id: string | number, options?: PersistencySearchOptions): Promise<TEntity> {
    return this._primaryManager.get(id, options);
  }

  /**
   * @inheritdoc
   */
  public async mDelete(ids: number[] | string[], options?: PersistencyDeleteOptions): Promise<any> {
    if (null != this._secondaryManager) {
      await this._secondaryManager.mDelete(ids);
    }
    return this._primaryManager.mDelete(ids, options);
  }

  /**
   * @inheritdoc
   */
  public mGet(ids: number[] | string[], options?: PersistencySearchOptions): Promise<TEntity[]> {
    return this._primaryManager.mGet(ids, options);
  }
}
