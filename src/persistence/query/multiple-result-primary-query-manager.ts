import { BasePrimaryQueryManager } from './primary-query-manager';
import { Entity } from '../../model/entity';

export interface MultipleResultPrimaryQueryManager<TEntity extends Entity>
  extends BasePrimaryQueryManager<TEntity, TEntity[]> {}
