import { Entity } from '../../model/entity';
import { QueryManager } from '../../persistence/primary/query/query-manager';

export interface ApiQueryManager<TEntity extends Entity, TResult extends TEntity | TEntity[]>
  extends QueryManager<TEntity, TResult> {}
