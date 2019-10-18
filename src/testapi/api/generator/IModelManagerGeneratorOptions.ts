import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';
import { IModelManagerGeneratorRedisOptions } from './IModelManagerGeneratorRedisOptions';
import { IModelManagerGeneratorSecodaryManagerOptions } from './IModelManagerGeneratorSecodaryManagerOptions';

export interface IModelManagerGeneratorOptions<
  TModel extends IModel,
  TRedisOptions extends IModelManagerGeneratorRedisOptions,
  TSecondaryOptions extends IModelManagerGeneratorSecodaryManagerOptions<ISecondaryEntityManager<IEntity>>
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
