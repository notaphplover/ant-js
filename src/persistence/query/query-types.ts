import { Entity } from '../../model/entity';

export type MultipleQueryResult = number[] | string[];
export type SingleQueryResult = number | string;
export type QueryResult = MultipleQueryResult | SingleQueryResult;

export type TResult<TEntity extends Entity, TQueryResult extends QueryResult> = TQueryResult extends MultipleQueryResult
  ? TEntity[]
  : TQueryResult extends SingleQueryResult
  ? TEntity
  : never;

export type TMQuery<TQueryResult> = (paramsArray: any[]) => Promise<TQueryResult[]>;
export type TQuery<TQueryResult> = (params: any) => Promise<TQueryResult>;
