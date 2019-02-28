import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { PrimaryModelManager } from '../../persistence/primary/PrimaryModelManager';

export class MinimunPrimaryModelManager<TModel extends IModel, TEntity extends IEntity>
  extends PrimaryModelManager<TModel, TEntity> {
}
