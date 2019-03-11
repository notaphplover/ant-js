import { IEntity } from '../../model/IEntity';
import { IEntityManager } from '../IEntityManager';

export interface ISecondaryModelManager<TEntity extends IEntity>
  extends IEntityManager<TEntity> {
}
