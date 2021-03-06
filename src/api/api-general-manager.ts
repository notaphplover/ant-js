import { ApiGeneralConfig } from './config/api-general-config';
import { ApiModel } from './api-model';
import { ApiModelConfig } from './config/api-model-config';
import { ApiModelManager } from './api-model-manager';
import { Entity } from '../model/entity';

export interface ApiGeneralManager<
  TConfig extends ApiModelConfig,
  TModel extends ApiModel,
  TAntModelManager extends ApiModelManager<Entity, TConfig>
> {
  /**
   * Gets the AntJS config.
   * @returns AntJS config.
   */
  config(): ApiGeneralConfig<TConfig>;
  /**
   * Sets the AntJS config.
   * @param config AntJS config.
   */
  config(config: ApiGeneralConfig<TConfig>): this;
  /**
   * Gets (or creates) a model manager by it's model.
   * @param model model of the manager.
   * @returns model manager found. If no manager is found, a new one is created and returned.
   */
  get(model: TModel): TAntModelManager;
}
