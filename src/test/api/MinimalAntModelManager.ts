import { AntModelManager } from '../../api/AntModelManager';
import { IAntModelConfig } from '../../api/config/IAntModelConfig';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { AntJsModelManagerGenerator } from '../../testapi/api/generator/AntJsModelManagerGenerator';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from '../primary/RedisWrapper';

export class MinimalAntModelManager<TEntity extends IEntity> extends AntModelManager<
  TEntity,
  IAntModelConfig,
  IModel,
  IModelManager<TEntity>
> {
  /**
   * Model manager generator.
   */
  protected _modelManagerGenerator: AntJsModelManagerGenerator;
  /**
   * Secondary entity manager.
   */
  protected _secondaryEntityManager: SecondaryEntityManagerMock<TEntity>;

  /**
   * Generates a new MinimalAntModelManager.
   * @param model Model to manage.
   * @param queriesMap Queries map.
   */
  public constructor(model: IModel) {
    super(model);
    this._modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
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
    const [modelManager] = this._modelManagerGenerator.generateModelManager({
      model: model,
      secondaryOptions: {
        manager: this._secondaryEntityManager,
      },
    });
    return modelManager as IModelManager<TEntity>;
  }
}
