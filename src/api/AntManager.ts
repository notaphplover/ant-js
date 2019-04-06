import { IEntity } from '../model/IEntity';
import { IModel } from '../model/IModel';
import { IAntConfig } from './config/IAntConfig';
import { IAntModelConfig } from './config/IAntModelConfig';
import { IAntManager } from './IAntManager';
import { IAntModelManager } from './IAntModelManager';

export abstract class AntManager<TConfig extends IAntModelConfig> implements IAntManager<TConfig> {
  /**
   * AntJS config.
   */
  protected _config: IAntConfig<TConfig>;

  /**
   * Map of managers by model.
   */
  protected _managersByModel: Map<IModel, IAntModelManager<any, TConfig>>;

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
  public config(config?: IAntConfig<TConfig>): IAntConfig<TConfig>|this {
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
  public get<TEntity extends IEntity>(model: IModel): IAntModelManager<TEntity, TConfig> {
    let manager = this._managersByModel.get(model) as IAntModelManager<TEntity, TConfig>;
    if (undefined === manager) {
      manager = this._createModelManager(model);
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
  protected abstract _createModelManager<TEntity extends IEntity>(model: IModel): IAntModelManager<TEntity, TConfig>;
}
