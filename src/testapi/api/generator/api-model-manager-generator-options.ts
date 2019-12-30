import { ApiModelManagerGeneratorRedisOptions } from './api-model-manager-generator-redis-options';
import { ApiModelManagerGeneratorSecodaryManagerOptions } from './api-model-manager-generator-secodary-manager-options';
import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';

export interface ApiModelManagerGeneratorOptions<
  TModel extends Model<Entity>,
  TRedisOptions extends ApiModelManagerGeneratorRedisOptions,
  TSecondaryOptions extends ApiModelManagerGeneratorSecodaryManagerOptions<SecondaryEntityManager<Entity>>
> {
  /**
   * Model to manage.
   */
  readonly model: TModel;
  /**
   * Redis options.
   */
  redisOptions?: TRedisOptions;
  /**
   * Secondary manager options;
   */
  secondaryOptions?: TSecondaryOptions;
}
