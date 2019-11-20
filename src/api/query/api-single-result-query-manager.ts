import { ApiQueryManager } from './api-query-manager';
import { Entity } from '../../model/entity';

export interface ApiSingleResultQueryManager<TEntity extends Entity> extends ApiQueryManager<TEntity, TEntity> {}
