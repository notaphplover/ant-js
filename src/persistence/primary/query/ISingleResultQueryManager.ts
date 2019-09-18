import { IEntity } from '../../../model/IEntity';
import { IBasePrimaryQueryManager } from './IPrimaryQueryManager';

export interface ISingleResultQueryManager<TEntity extends IEntity>
  extends IBasePrimaryQueryManager<TEntity, TEntity> {}
