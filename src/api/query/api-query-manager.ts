import { IEntity } from '../../model/IEntity';
import { QueryManager } from '../../persistence/primary/query/query-manager';

export interface ApiQueryManager<TEntity extends IEntity, TResult extends TEntity | TEntity[]>
  extends QueryManager<TEntity, TResult> {}
