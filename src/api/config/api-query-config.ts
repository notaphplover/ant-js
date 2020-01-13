import { QueryResult, TMQuery, TQuery } from '../../persistence/primary/query/query-types';
import { Entity } from '../../model/entity';

export interface ApiQueryConfig<TEntity extends Entity, TQueryResult extends QueryResult> {
  /**
   * True if the query returns an array of results instead of a single result.
   */
  readonly isMultiple: boolean;
  /**
   * Entity key generator.
   *
   * This function is used in order to generate a key from an entity.
   * This function is called whenever the query manager needs to know which query key is associated to a certain entity.
   */
  readonly entityKeyGen?: (entity: TEntity) => string;
  /**
   * Query key generator.
   *
   * This function is used in order to know which query key is accesed when a query is performed.
   */
  readonly queryKeyGen: (params: any) => string;
  /**
   * Multiple query.
   * This function receives an array of queries and returns a promise of an array of query results.
   * There must be a result for each query performed.
   * The ith query result must be the result of the ith query requested.
   */
  readonly mQuery?: TMQuery<TQueryResult>;
  /**
   * Single query.
   * This function receives a query and returns a promise of query results.
   */
  readonly query: TQuery<TQueryResult>;
  /**
   * Key to store a hash used by AntJS to manage queries properly.
   */
  readonly reverseHashKey: string;
}
