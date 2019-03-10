import { IEntity } from '../../model/IEntity';
import { IModelManager } from '../IModelManager';

export interface ISecondaryModelManager<TEntity extends IEntity>
  extends IModelManager<TEntity> {
}
