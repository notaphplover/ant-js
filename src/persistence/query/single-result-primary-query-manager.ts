import { BasePrimaryQueryManager } from './primary-query-manager';
import { Entity } from '../../model/entity';

export interface SingleResultPrimaryQueryManager<TEntity extends Entity>
  extends BasePrimaryQueryManager<TEntity, TEntity> {}
