import { IEntity } from '../model/IEntity';
import { IModel } from '../model/IModel';
import { ApiModelManager } from './api-model-manager';
import { IAntConfig } from './config/IAntConfig';
import { IAntModelConfig } from './config/IAntModelConfig';

export interface ApiGeneralManager<
  TConfig extends IAntModelConfig,
  TModel extends IModel,
  TAntModelManager extends ApiModelManager<IEntity, TConfig>
> {
  /**
   * Gets the AntJS config.
   * @returns AntJS config.
   */
  config(): IAntConfig<TConfig>;
  /**
   * Sets the AntJS config.
   * @param config AntJS config.
   */
  config(config: IAntConfig<TConfig>): this;
  /**
   * Gets (or creates) a model manager.
   * @param model model of the manager.
   * @returns model manager of the model provided.
   */
  get(model: TModel): TAntModelManager;
}
