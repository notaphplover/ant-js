import { Entity } from '../model/entity';
import { ApiGeneralManager } from './api-general-manager';
import { ApiModel } from './api-model';
import { ApiModelManager } from './api-model-manager';
import { ApiGeneralConfig } from './config/api-general-config';
import { ApiModelConfig } from './config/api-model-config';

export abstract class AntManager<
  TConfig extends ApiModelConfig,
  TModel extends ApiModel,
  TAntModelManager extends ApiModelManager<Entity, TConfig>
> implements ApiGeneralManager<TConfig, TModel, TAntModelManager> {
  /**
   * AntJS config.
   */
  protected _config: ApiGeneralConfig<TConfig>;

  /**
   * Map of managers by model.
   */
  protected _managersByModel: Map<TModel, TAntModelManager>;

  /**
   * Creates a new AntJS manager.
   */
  public constructor() {
    this._managersByModel = new Map();
  }

  /**
   * Gets the current AntJS config.
   * @returns Current AntJS config.
   */
  public config(): ApiGeneralConfig<TConfig>;
  /**
   * Sets the current AntJS config.
   * @param config new AntJS config.
   * @returns this instance.
   */
  public config(config: ApiGeneralConfig<TConfig>): this;
  public config(config?: ApiGeneralConfig<TConfig>): ApiGeneralConfig<TConfig> | this {
    if (undefined === config) {
      return this._config;
    } else {
      this._config = config;
      return this;
    }
  }

  /**
   * Gets an AntJS model manager.
   * @param model model of the manager.
   * @returns AntJS model manager found.
   */
  public get(model: TModel): TAntModelManager {
    let manager = this._managersByModel.get(model);
    if (undefined === manager) {
      manager = this._createModelManager(model);
      this._managersByModel.set(model, manager);
      const config = this.config();
      if (config && config.default) {
        manager.config(config.default);
      }
    }
    return manager;
  }

  /**
   * Creates a model manager.
   * @param model Model to manage.
   * @returns model manager created.
   */
  protected abstract _createModelManager(model: TModel): TAntModelManager;
}
