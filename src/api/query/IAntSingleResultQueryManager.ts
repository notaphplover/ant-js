import { IEntity } from '../../model/IEntity';
import { IAntQueryManager } from './IAntQueryManager';

export interface IAntSingleResultQueryManager<TEntity extends IEntity> extends IAntQueryManager<TEntity, TEntity> {}
