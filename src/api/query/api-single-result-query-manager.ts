import { Entity } from '../../model/entity';
import { ApiQueryManager } from './api-query-manager';

export interface ApiSingleResultQueryManager<TEntity extends Entity> extends ApiQueryManager<TEntity, TEntity> {}
