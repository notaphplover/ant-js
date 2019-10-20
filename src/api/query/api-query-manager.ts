import { IEntity } from '../../model/IEntity';
import { IQueryManager } from '../../persistence/primary/query/IQueryManager';

export interface ApiQueryManager<TEntity extends IEntity, TResult extends TEntity | TEntity[]>
  extends IQueryManager<TEntity, TResult> {}
