import { AntPrimaryModelManager } from '../../../persistence/primary/ant-primary-model-manager';
import { AntSchedulerModelManager } from '../../../persistence/scheduler/ant-scheduler-model-manager';
import { ApiModelManagerGeneratorOptions } from './api-model-manager-generator-options';
import { ApiModelManagerGeneratorRedisOptions } from './api-model-manager-generator-redis-options';
import { ApiModelManagerGeneratorSecodaryManagerOptions } from './api-model-manager-generator-secodary-manager-options';
import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { ModelManagerGenerator } from './model-manager-generator';
import { PrimaryModelManager } from '../../../persistence/primary/primary-model-manager';
import { SchedulerModelManager } from '../../../persistence/scheduler/scheduler-model-manager';
import { SecondaryEntityManagerMock } from '../secondary/secondary-entity-manager-mock';

type TModelManagerOptions = ApiModelManagerGeneratorOptions<
  Model<Entity>,
  ApiModelManagerGeneratorRedisOptions,
  ApiModelManagerGeneratorSecodaryManagerOptions<SecondaryEntityManagerMock<Entity>>
>;

export class AntJsModelManagerGenerator extends ModelManagerGenerator<
  TModelManagerOptions,
  PrimaryModelManager<Entity>,
  SecondaryEntityManagerMock<Entity>,
  SchedulerModelManager<Entity>
> {
  /**
   * @inheritdoc
   */
  protected _generateDefaultSecondaryManager(options: TModelManagerOptions): SecondaryEntityManagerMock<Entity> {
    return new SecondaryEntityManagerMock(options.model);
  }

  /**
   * @inheritdoc
   */
  protected _generateModelManager(options: TModelManagerOptions): PrimaryModelManager<Entity> {
    return new AntPrimaryModelManager(
      options.model,
      options.redisOptions.redis,
      options.redisOptions.useEntityNegativeCache ?? true,
    );
  }

  protected _generateSchedulerManager(
    model: Model<Entity>,
    primaryManager: PrimaryModelManager<Entity>,
    secondaryManager: SecondaryEntityManagerMock<Entity>,
  ): SchedulerModelManager<Entity> {
    return new AntSchedulerModelManager(model, primaryManager, secondaryManager);
  }

  /**
   * @inheritdoc
   */
  protected _searchEntitiesByProperty<TEntity extends Entity>(
    secondaryManager: SecondaryEntityManagerMock<Entity>,
    property: string,
    value: any,
  ): Promise<TEntity[]> {
    return new Promise<TEntity[]>((resolve) => {
      const entitiesByProperty = new Array<TEntity>();
      for (const entity of (secondaryManager as SecondaryEntityManagerMock<TEntity>).store.values()) {
        if (value === entity[property]) {
          entitiesByProperty.push(entity);
        }
      }
      resolve(entitiesByProperty);
    });
  }

  /**
   * @inheritdoc
   */
  protected _searchEntityByProperty<TEntity extends Entity>(
    secondaryManager: SecondaryEntityManagerMock<Entity>,
    property: string,
    value: any,
  ): Promise<TEntity> {
    return new Promise<TEntity>((resolve) => {
      for (const entity of (secondaryManager as SecondaryEntityManagerMock<TEntity>).store.values()) {
        if (value === entity[property]) {
          resolve(entity);
          return;
        }
      }
      resolve(null);
    });
  }
}
