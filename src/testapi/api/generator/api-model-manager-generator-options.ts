import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';
import { ApiModelManagerGeneratorRedisOptions } from './api-model-manager-generator-redis-options';
import { ApiModelManagerGeneratorSecodaryManagerOptions } from './api-model-manager-generator-secodary-manager-options';

export interface ApiModelManagerGeneratorOptions<
  TModel extends Model,
  TRedisOptions extends ApiModelManagerGeneratorRedisOptions,
  TSecondaryOptions extends ApiModelManagerGeneratorSecodaryManagerOptions<SecondaryEntityManager<Entity>>
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
