import { AntQueryManager } from '../../../api/query/ant-query-manager';
import { Entity } from '../../../model/entity';

export class MinimalAntQueryManager<
  TEntity extends Entity,
  TResult extends TEntity | TEntity[]
> extends AntQueryManager<TEntity, TResult> {}
