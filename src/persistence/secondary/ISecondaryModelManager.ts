import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { IModelManager } from '../IModelManager';

export interface ISecondaryModelManager<TModel extends IModel, TEntity extends IEntity>
  extends IModelManager<TModel, TEntity> {
  /**
   * Model of the manager.
   */
  model: TModel;
}
