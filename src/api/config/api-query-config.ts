import { Entity } from '../../model/entity';
import { QueryResult, TMQuery, TQuery } from '../../persistence/primary/query/ant-primary-query-manager';

export interface ApiQueryConfig<TEntity extends Entity, TQueryResult extends QueryResult> {
  /**
   * True if the query returns an array of results instead of a single result.
   */
  isMultiple: boolean;
  /**
   * Entity key generator
   */
  entityKeyGen?: (entity: TEntity) => string;
  /**
   * Query key generator.
   */
  queryKeyGen: (params: any) => string;
  /**
   * Multiple query.
   */
  mQuery?: TMQuery<TQueryResult>;
  /**
   * Single query.
   */
  query: TQuery<TQueryResult>;
  /**
   * Key to store a hash used by AntJS to manage queries properly.
   */
  reverseHashKey: string;
}
