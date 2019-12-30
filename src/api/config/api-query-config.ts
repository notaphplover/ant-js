import { QueryResult, TMQuery, TQuery } from '../../persistence/primary/query/ant-primary-query-manager';
import { Entity } from '../../model/entity';

export interface ApiQueryConfig<TEntity extends Entity, TQueryResult extends QueryResult> {
  /**
   * True if the query returns an array of results instead of a single result.
   */
  readonly isMultiple: boolean;
  /**
   * Entity key generator
   */
  readonly entityKeyGen?: (entity: TEntity) => string;
  /**
   * Query key generator.
   */
  readonly queryKeyGen: (params: any) => string;
  /**
   * Multiple query.
   */
  readonly mQuery?: TMQuery<TQueryResult>;
  /**
   * Single query.
   */
  readonly query: TQuery<TQueryResult>;
  /**
   * Key to store a hash used by AntJS to manage queries properly.
   */
  readonly reverseHashKey: string;
}
