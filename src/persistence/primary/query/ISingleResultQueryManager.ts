import { Entity } from '../../../model/entity';
import { IBasePrimaryQueryManager } from './IPrimaryQueryManager';

export interface ISingleResultQueryManager<TEntity extends Entity> extends IBasePrimaryQueryManager<TEntity, TEntity> {}
