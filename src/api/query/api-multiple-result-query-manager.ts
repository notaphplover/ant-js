import { ApiQueryManager } from './api-query-manager';
import { Entity } from '../../model/entity';

export interface ApiMultipleResultQueryManager<TEntity extends Entity> extends ApiQueryManager<TEntity, TEntity[]> {}
