import { Entity } from '../../model/entity';
import { QueryManager } from './query-manager';

export interface BasePrimaryQueryManager<TEntity extends Entity, TResult extends TEntity | TEntity[]>
  extends QueryManager<TEntity, TResult> {
  /**
   * True if the queries managed can return multiple results.
   */
  readonly isMultiple: boolean;
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
  readonly reverseHashKey: string;
}

export interface PrimaryQueryManager<TEntity extends Entity>
  extends BasePrimaryQueryManager<TEntity, TEntity | TEntity[]> {}
