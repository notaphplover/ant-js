import { IEntity } from '../../../model/IEntity';
import { IBasePrimaryQueryManager } from './IPrimaryQueryManager';

export interface IMultipleResultQueryManager<TEntity extends IEntity>
  extends IBasePrimaryQueryManager<TEntity, TEntity[]> {}
