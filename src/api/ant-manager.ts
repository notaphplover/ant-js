import { IEntity } from '../model/IEntity';
import { IModel } from '../model/IModel';
import { IAntConfig } from './config/IAntConfig';
import { IAntModelConfig } from './config/IAntModelConfig';
import { GeneralApiManager } from './general-api-manager';
import { IAntModelManager } from './IAntModelManager';

export abstract class AntManager<
  TConfig extends IAntModelConfig,
  TModel extends IModel,
  TAntModelManager extends IAntModelManager<IEntity, TConfig>
> implements GeneralApiManager<TConfig, TModel, TAntModelManager> {
  /**
   * AntJS config.
   */
  protected _config: IAntConfig<TConfig>;

  /**
   * Map of managers by model.
   */
  protected _managersByModel: Map<IModel, TAntModelManager>;

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
  public config(): IAntConfig<TConfig>;
  /**
   * Sets the current AntJS config.
   * @param config new AntJS config.
   * @returns this instance.
   */
  public config(config: IAntConfig<TConfig>): this;
  public config(config?: IAntConfig<TConfig>): IAntConfig<TConfig> | this {
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
