import { AntQueryManager } from '../../../api/query/AntQueryManager';
import { IEntity } from '../../../model/IEntity';

export class MinimalAntQueryManager<
  TEntity extends IEntity,
  TResult extends TEntity | TEntity[],
> extends AntQueryManager<TEntity, TResult> {}
