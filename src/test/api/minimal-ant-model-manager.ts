import { AntJsModelManagerGenerator } from '../../testapi/api/generator/antjs-model-manager-generator';
import { AntModelManager } from '../../api/ant-model-manager';
import { ApiModelConfig } from '../../api/config/api-model-config';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PrimaryModelManager } from '../../persistence/primary/primary-model-manager';
import { RedisWrapper } from '../primary/redis-wrapper';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/secondary-entity-manager-mock';

export class MinimalAntModelManager<TEntity extends Entity> extends AntModelManager<
  TEntity,
  ApiModelConfig,
  Model<TEntity>,
  PrimaryModelManager<TEntity>
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
  public constructor(model: Model<TEntity>) {
    super(model);
    this._modelManagerGenerator = new AntJsModelManagerGenerator(new RedisWrapper().redis);
    this._secondaryEntityManager = new SecondaryEntityManagerMock<TEntity>(model);
  }

  /**
   * Model manager.
   * @returns Model manager.
   */
  public get modelManager(): PrimaryModelManager<TEntity> {
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
   * @returns Model manager generated.
   */
  protected _generateModelManager(model: Model<TEntity>): PrimaryModelManager<TEntity> {
    const [modelManager] = this._modelManagerGenerator.generateModelManager({
      model,
      secondaryOptions: {
        manager: this._secondaryEntityManager,
      },
    });
    return modelManager as PrimaryModelManager<TEntity>;
  }
}
