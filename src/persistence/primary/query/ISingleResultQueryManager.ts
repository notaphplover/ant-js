import { Entity } from '../../../model/entity';
import { BasePrimaryQueryManager } from './primary-query-manager';

export interface ISingleResultQueryManager<TEntity extends Entity> extends BasePrimaryQueryManager<TEntity, TEntity> {}
