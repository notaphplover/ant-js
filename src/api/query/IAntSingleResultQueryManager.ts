import { IEntity } from '../../model/IEntity';
import { ApiQueryManager } from './api-query-manager';

export interface IAntSingleResultQueryManager<TEntity extends IEntity> extends ApiQueryManager<TEntity, TEntity> {}
