import { Entity } from '../../../model/entity';
import { IBasePrimaryQueryManager } from './IPrimaryQueryManager';

export interface IMultipleResultQueryManager<TEntity extends Entity>
  extends IBasePrimaryQueryManager<TEntity, TEntity[]> {}
