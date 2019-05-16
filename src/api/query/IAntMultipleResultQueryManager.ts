import { IEntity } from '../../model/IEntity';
import { IAntQueryManager } from './IAntQueryManager';

export interface IAntMultipleResultQueryManager<TEntity extends IEntity>
  extends IAntQueryManager<TEntity, TEntity[]> {}
