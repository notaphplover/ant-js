import { IEntity } from '../../model/IEntity';
import { IEntityManager } from '../IEntityManager';

export interface ISecondaryEntityManager<TEntity extends IEntity>
  extends IEntityManager<TEntity> {
}
