import { AntManager } from '../../api/AntManager';
import { QueryMapType } from '../../api/AntModelManager';
import { IAntModelConfig } from '../../api/config/IAntModelConfig';
import { IAntModelManager } from '../../api/IAntModelManager';
import { IModel } from '../../model/IModel';
import { MinimalAntModelManager } from './MinimalAntModelManager';

export class MinimalAntManager extends AntManager<
  IAntModelConfig,
  IModel,
  IAntModelManager<any, IAntModelConfig>
> {
  /**
   * Queries map.
   */
  protected _queriesMap: QueryMapType<any, IModel>;

  /**
   * Creates a new minimal ant manager.
   */
  public constructor() {
    super();
    this._queriesMap = new Map();
  }

  /**
   * Creates a model manager.
   * @param model Model to manage.
   * @returns model manager created.
   */
  protected _createModelManager(model: IModel) {
    return new MinimalAntModelManager(model, this._queriesMap);
  }
}
