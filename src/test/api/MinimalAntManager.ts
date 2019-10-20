import { AntManager } from '../../api/ant-manager';
import { ApiModelManager } from '../../api/api-model-manager';
import { ApiModelConfig } from '../../api/config/api-model-config';
import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { MinimalAntModelManager } from './MinimalAntModelManager';

export class MinimalAntManager extends AntManager<ApiModelConfig, IModel, ApiModelManager<IEntity, ApiModelConfig>> {
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
