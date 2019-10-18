import { AntManager } from '../../api/AntManager';
import { IAntModelConfig } from '../../api/config/IAntModelConfig';
import { IAntModelManager } from '../../api/IAntModelManager';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { MinimalAntModelManager } from './MinimalAntModelManager';

export class MinimalAntManager extends AntManager<IAntModelConfig, IModel, IAntModelManager<IEntity, IAntModelConfig>> {
  /**
   * Creates a new minimal ant manager.
   */
  public constructor() {
    super();
  }

  /**
   * Creates a model manager.
   * @param model Model to manage.
   * @returns model manager created.
   */
  protected _createModelManager(model: IModel) {
    return new MinimalAntModelManager(model);
  }
}
