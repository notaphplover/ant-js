import { AntManager } from '../../api/ant-manager';
import { ApiModel } from '../../api/api-model';
import { ApiModelManager } from '../../api/api-model-manager';
import { ApiModelConfig } from '../../api/config/api-model-config';
import { AntModel } from '../../model/ant-model';
import { Entity } from '../../model/entity';
import { MinimalAntModelManager } from './minimal-ant-model-manager';

export class MinimalAntManager extends AntManager<ApiModelConfig, ApiModel, ApiModelManager<Entity, ApiModelConfig>> {
  /**
   * Creates a new minimal ant manager.
   */
  public constructor() {
    super();
  }

  /**
   * Creates a model manager.
   * @param apiModel Model to manage.
   * @returns model manager created.
   */
  protected _createModelManager(apiModel: ApiModel): MinimalAntModelManager<Entity> {
    return new MinimalAntModelManager(new AntModel(apiModel.id, apiModel.keyGen));
  }
}
