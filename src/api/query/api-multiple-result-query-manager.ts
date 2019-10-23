import { Entity } from '../../model/entity';
import { ApiQueryManager } from './api-query-manager';

export interface ApiMultipleResultQueryManager<TEntity extends Entity> extends ApiQueryManager<TEntity, TEntity[]> {}
