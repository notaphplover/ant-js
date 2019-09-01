import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { IModelManager } from '../../../persistence/primary/IModelManager';
import { ModelManager } from '../../../persistence/primary/ModelManager';
import { IMultipleResultQueryManager } from '../../../persistence/primary/query/IMultipleResultQueryManager';
import { ISingleResultQueryManager } from '../../../persistence/primary/query/ISingleResultQueryManager';
import { SecondaryEntityManagerMock } from '../../../test/secondary/SecondaryEntityManagerMock';
import { IModelManagerGeneratorOptions } from './IModelManagerGeneratorOptions';
import { IModelManagerGeneratorRedisOptions } from './IModelManagerGeneratorRedisOptions';
import { IModelManagerGeneratorSecodaryManagerOptions } from './IModelManagerGeneratorSecodaryManagerOptions';
import { ModelManagerGenerator } from './ModelManagerGenerator';

type TModelManagerOptions = IModelManagerGeneratorOptions<
  IModel,
  IModelManagerGeneratorRedisOptions,
  IModelManagerGeneratorSecodaryManagerOptions<SecondaryEntityManagerMock<IEntity>>
>;

export class AntJsModelManagerGenerator extends ModelManagerGenerator<
  TModelManagerOptions,
  IModelManager<IEntity>,
  SecondaryEntityManagerMock<IEntity>
> {
  /**
   * @inheritdoc
   */
  protected _generateModelManager(
    options: TModelManagerOptions,
    secondaryManager: SecondaryEntityManagerMock<IEntity>,
  ): IModelManager<IEntity> {
    return new ModelManager(
      options.model,
      options.redisOptions.redis,
      options.redisOptions.useEntityNegativeCache || true,
      secondaryManager,
    );
  }

  /**
   * @inheritdoc
   */
  protected _generateDefaultSecondaryManager(
    options: TModelManagerOptions,
  ): SecondaryEntityManagerMock<IEntity> {
    return new SecondaryEntityManagerMock(options.model);
  }

  /**
   * @inheritdoc
   */
  protected _searchEntitiesByProperty<TEntity extends IEntity>(
    secondaryManager: SecondaryEntityManagerMock<IEntity>,
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
  protected _searchEntityByProperty<TEntity extends IEntity>(
    secondaryManager: SecondaryEntityManagerMock<IEntity>,
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
