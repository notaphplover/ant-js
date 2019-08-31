import { IModel } from '../../../model/IModel';
import { IModelManagerGeneratorRedisOptions } from './IModelManagerGeneratorRedisOptions';

export interface IModelManagerGeneratorOptions<TModel extends IModel> {
  /**
   * Model to manage.
   */
  model: TModel;
  /**
   * Redis options.
   */
  redisOptions?: IModelManagerGeneratorRedisOptions;
}
