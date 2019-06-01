import {
  AntModelManager,
  QueryMapType,
} from '../../api/AntModelManager';
import { IAntModelConfig } from '../../api/config/IAntModelConfig';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { ModelManagerGenerator } from '../primary/ModelManagerGenerator';
import { SecondaryEntityManagerMock } from '../secondary/SecondaryEntityManagerMock';

export class MinimalAntModelManager<
  TEntity extends IEntity,
> extends AntModelManager<TEntity, IAntModelConfig, IModel, IModelManager<TEntity>> {
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
    queriesMap: QueryMapType<TEntity, IModel>,
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
}
