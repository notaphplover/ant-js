import {
  AntModelManager,
  QueryMapType,
} from '../../api/AntModelManager';
import { IAntModelConfig } from '../../api/config/IAntModelConfig';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { IPrimaryEntityManager } from '../../persistence/primary/IPrimaryEntityManager';
import { PrimaryEntityManager } from '../../persistence/primary/PrimaryEntityManager';
import { ModelManagerGenerator } from '../primary/ModelManagerGenerator';
import { SecondaryEntityManagerMock } from '../secondary/SecondaryEntityManagerMock';

export class MinimalAntModelManager<
  TEntity extends IEntity,
> extends AntModelManager<TEntity, IAntModelConfig> {
  /**
   * Model manager generator.
   */
  protected _modelManagerGenerator: ModelManagerGenerator<TEntity>;
  /**
   * Secondary entity manager.
   */
  protected _secondaryEntityManager: SecondaryEntityManagerMock<TEntity>;

  /**
   * Generates a new MinimalAntModelManager.
   * @param model Model to manage.
   * @param queriesMap Queries map.
   */
  public constructor(
    model: IModel,
    queriesMap: QueryMapType<TEntity>,
  ) {
    super(model, queriesMap);
    this._modelManagerGenerator = new ModelManagerGenerator();
    this._secondaryEntityManager = new SecondaryEntityManagerMock<TEntity>(model);
  }

  /**
   * Model manager.
   * @returns Model manager.
   */
  public get modelManager(): IModelManager<TEntity> {
    return super.modelManager;
  }
  /**
   * Primary entity manager.
   */
  public get primaryEntityManager(): IPrimaryEntityManager<TEntity> {
    return super.primaryEntityManager;
  }
  /**
   * Secondary model manager.
   * @returns secondary model manager.
   */
  public get secondaryModelManager(): SecondaryEntityManagerMock<TEntity> {
    return this._secondaryEntityManager;
  }

  /**
   * Generates a model manager.
   * @param model Model to manage.
   * @param config AntJS model config.
   * @returns Model manager generated.
   */
  protected _generateModelManager(model: IModel, config: IAntModelConfig): IModelManager<TEntity> {
    const [modelManager] = this._modelManagerGenerator.generateZeroQueriesModelManager(
      model,
      this._secondaryEntityManager,
    );
    return modelManager;
  }

  /**
   * Creates a new primary entity manager.
   * @param model Model of the manager.
   * @param config Manager config.
   * @returns Primary entity manager generated.
   */
  protected _generatePrimaryEntityManager(
    model: IModel,
    config: IAntModelConfig,
  ): IPrimaryEntityManager<TEntity> {
    return new PrimaryEntityManager(
      model,
      config.redis,
      this._secondaryEntityManager,
    );
  }
}
