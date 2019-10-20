import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';
import { IModelManagerGeneratorRedisOptions } from './IModelManagerGeneratorRedisOptions';
import { IModelManagerGeneratorSecodaryManagerOptions } from './IModelManagerGeneratorSecodaryManagerOptions';

export interface IModelManagerGeneratorOptions<
  TModel extends Model,
  TRedisOptions extends IModelManagerGeneratorRedisOptions,
  TSecondaryOptions extends IModelManagerGeneratorSecodaryManagerOptions<SecondaryEntityManager<Entity>>
> {
  /**
   * Model to manage.
   */
  model: TModel;
  /**
   * Redis options.
   */
  redisOptions?: TRedisOptions;
  /**
   * Secondary manager options;
   */
  secondaryOptions?: TSecondaryOptions;
}
