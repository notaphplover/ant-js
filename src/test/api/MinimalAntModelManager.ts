import { AntModelManager } from '../../api/ant-model-manager';
import { ApiModelConfig } from '../../api/config/api-model-config';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { IModelManager } from '../../persistence/primary/IModelManager';
import { AntJsModelManagerGenerator } from '../../testapi/api/generator/AntJsModelManagerGenerator';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/SecondaryEntityManagerMock';
import { RedisWrapper } from '../primary/RedisWrapper';

export class MinimalAntModelManager<TEntity extends Entity> extends AntModelManager<
  TEntity,
  ApiModelConfig,
  Model,
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
  public constructor(model: Model) {
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
  protected _generateModelManager(model: Model, config: ApiModelConfig): IModelManager<TEntity> {
    const [modelManager] = this._modelManagerGenerator.generateModelManager({
      model: model,
      secondaryOptions: {
        manager: this._secondaryEntityManager,
      },
    });
    return modelManager as IModelManager<TEntity>;
  }
}
