import { AntJsModelManagerGenerator } from '../../testapi/api/generator/antjs-model-manager-generator';
import { AntModelManager } from '../../api/ant-model-manager';
import { AntScheduleModelManager } from '../../persistence/scheduler/ant-scheduler-model-manager';
import { ApiModelConfig } from '../../api/config/api-model-config';
import { Entity } from '../../model/entity';
import { Model } from '../../model/model';
import { PrimaryModelManager } from '../../persistence/primary/primary-model-manager';
import { RedisWrapper } from '../primary/redis-wrapper';
import { SchedulerModelManager } from '../../persistence/scheduler/scheduler-model-manager';
import { SecondaryEntityManagerMock } from '../../testapi/api/secondary/secondary-entity-manager-mock';

export class MinimalAntModelManager<TEntity extends Entity> extends AntModelManager<
  TEntity,
  ApiModelConfig,
  Model<TEntity>,
  SchedulerModelManager<TEntity>
> {
  /**
   * Model manager generator.
   */
  protected _modelManagerGenerator: AntJsModelManagerGenerator;

  /**
   * Primary manager.
   */
  protected _primaryManager: PrimaryModelManager<TEntity>;

  /**
   * Secondary manager.
   */
  protected _secondaryManager: SecondaryEntityManagerMock<TEntity>;

  /**
   * Generates a new MinimalAntModelManager.
   * @param model Model to manage.
   * @param queriesMap Queries map.
   */
  public constructor(model: Model<TEntity>) {
    super(model);
    const redisMiddleware = new RedisWrapper().redis;
    this._modelManagerGenerator = new AntJsModelManagerGenerator(redisMiddleware);
    this._secondaryManager = this._generateSecondaryManager(model);
    this._primaryManager = this._generatePrimaryManager(model, { redis: redisMiddleware }, this._secondaryManager);
  }

  /**
   * Model manager.
   * @returns Model manager.
   */
  public get primaryManager(): PrimaryModelManager<TEntity> {
    return this._primaryManager;
  }

  public get scheduledManager(): SchedulerModelManager<TEntity> {
    return super.scheduledManager;
  }
  /**
   * Secondary model manager.
   * @returns secondary model manager.
   */
  public get secondaryManager(): SecondaryEntityManagerMock<TEntity> {
    return this._secondaryManager;
  }

  /**
   * @inheritdoc
   */
  protected _generatePrimaryManager(
    model: Model<TEntity>,
    config: ApiModelConfig,
    secondaryManager: SecondaryEntityManagerMock<TEntity>,
  ): PrimaryModelManager<TEntity> {
    const [modelManager] = this._modelManagerGenerator.generateModelManager({
      model,
      redisOptions: { redis: config.redis },
      secondaryOptions: {
        manager: secondaryManager,
      },
    });
    return modelManager as PrimaryModelManager<TEntity>;
  }

  /**
   * @inheritdoc
   */
  protected _generateScheduledManager(model: Model<TEntity>): SchedulerModelManager<TEntity> {
    return new AntScheduleModelManager(model, this._primaryManager, this._secondaryManager);
  }

  /**
   * @inheritdoc
   */
  protected _generateSecondaryManager(model: Model<TEntity>): SecondaryEntityManagerMock<TEntity> {
    return new SecondaryEntityManagerMock<TEntity>(model);
  }
}
