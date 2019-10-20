import { IEntity } from '../../../model/IEntity';
import { QueryManager } from './query-manager';

export interface IBasePrimaryQueryManager<TEntity extends IEntity, TResult extends TEntity | TEntity[]>
  extends QueryManager<TEntity, TResult> {
  /**
   * True if the queries managed can return multiple results.
   */
  isMultiple: boolean;
  /**
   * Query key generator.
   */
  entityKeyGen: (entity: TEntity) => string;
  /**
   * Query key generator.
   */
  queryKeyGen: (params: any) => string;
  /**
   * Obtains the reverse hash key.
   */
  reverseHashKey: string;
}

export interface IPrimaryQueryManager<TEntity extends IEntity>
  extends IBasePrimaryQueryManager<TEntity, TEntity | TEntity[]> {}
