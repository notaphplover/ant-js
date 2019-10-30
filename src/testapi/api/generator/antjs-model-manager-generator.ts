import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { AntPrimaryModelManager } from '../../../persistence/primary/ant-primary-model-manager';
import { PrimaryModelManager } from '../../../persistence/primary/primary-model-manager';
import { SecondaryEntityManagerMock } from '../secondary/secondary-entity-manager-mock';
import { ApiModelManagerGeneratorOptions } from './api-model-manager-generator-options';
import { ApiModelManagerGeneratorRedisOptions } from './api-model-manager-generator-redis-options';
import { ApiModelManagerGeneratorSecodaryManagerOptions } from './api-model-manager-generator-secodary-manager-options';
import { ModelManagerGenerator } from './model-manager-generator';

type TModelManagerOptions = ApiModelManagerGeneratorOptions<
  Model<Entity>,
  ApiModelManagerGeneratorRedisOptions,
  ApiModelManagerGeneratorSecodaryManagerOptions<SecondaryEntityManagerMock<Entity>>
>;

export class AntJsModelManagerGenerator extends ModelManagerGenerator<
  TModelManagerOptions,
  PrimaryModelManager<Entity>,
  SecondaryEntityManagerMock<Entity>
> {
  /**
   * @inheritdoc
   */
  protected _generateModelManager(
    options: TModelManagerOptions,
    secondaryManager: SecondaryEntityManagerMock<Entity>,
  ): PrimaryModelManager<Entity> {
    return new AntPrimaryModelManager(
      options.model,
      options.redisOptions.redis,
      options.redisOptions.useEntityNegativeCache || true,
      secondaryManager,
    );
  }

  /**
   * @inheritdoc
   */
  protected _generateDefaultSecondaryManager(options: TModelManagerOptions): SecondaryEntityManagerMock<Entity> {
    return new SecondaryEntityManagerMock(options.model);
  }

  /**
   * @inheritdoc
   */
  protected _searchEntitiesByProperty<TEntity extends Entity>(
    secondaryManager: SecondaryEntityManagerMock<Entity>,
    property: string,
    value: any,
  ): Promise<TEntity[]> {
    return new Promise((resolve) => {
      resolve(
        (secondaryManager as SecondaryEntityManagerMock<TEntity>).store.filter(
          (entity: TEntity) => value === entity[property],
        ),
      );
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
    return new Promise((resolve) => {
      resolve(
        (secondaryManager as SecondaryEntityManagerMock<TEntity>).store.find(
          (entity: TEntity) => value === entity[property],
        ),
      );
    });
  }
}
