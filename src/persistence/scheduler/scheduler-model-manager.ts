import { MultipleQueryResult, SingleQueryResult, TMQuery, TQuery } from '../query/query-types';
import { Entity } from '../../model/entity';
import { MultipleResultPrimaryQueryManager } from '../query/multiple-result-primary-query-manager';
import { PersistencyDeleteOptions } from '../options/persistency-delete-options';
import { PersistencySearchOptions } from '../options/persistency-search-options';
import { RedisMiddleware } from '../primary/redis-middleware';
import { SingleResultPrimaryQueryManager } from '../query/single-result-primary-query-manager';

export interface SchedulerModelManagerBase<TEntity> {
  /**
   * Deletes an entity from the cache layer.
   * @param id id of the entity to delete.
   * @param options Delete options.
   * @returns Promise of entity deleted.
   */
  delete(id: number | string, options?: Partial<PersistencyDeleteOptions>): Promise<any>;
  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @param options Cache options.
   * @returns Model found.
   */
  get(id: number | string, options?: Partial<PersistencySearchOptions>): Promise<TEntity>;
  /**
   * Deletes multiple entities from the cache layer.
   * @param ids Ids of the entities to delete.
   * @param options Delete options.
   * @returns Promise of entities deleted.
   */
  mDelete(ids: number[] | string[], options?: Partial<PersistencyDeleteOptions>): Promise<any>;
  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param options Cache options.
   * @returns Models found.
   */
  mGet(ids: number[] | string[], options?: Partial<PersistencySearchOptions>): Promise<TEntity[]>;
}

export interface SchedulerModelManager<TEntity extends Entity> extends SchedulerModelManagerBase<TEntity> {
  /**
   * Adds a single result query to the manager and returns it.
   * @param query Single ids query handler.
   * @param redis Redis middleware.
   * @param reverseHashKey Redis reverse hash key.
   * @param queryKeyGen Query key generator.
   * @param entityKeyGen Entity key generator.
   * @param mquery Multiple ids query handler.
   * @returns Single query result manager generated.
   */
  addMultipleResultQuery<TResult extends MultipleQueryResult>(
    query: TQuery<TResult>,
    redis: RedisMiddleware,
    reverseHashKey: string,
    queryKeyGen: (params: any) => string,
    entityKeyGen: (entity: TEntity) => string,
    mquery: TMQuery<TResult>,
  ): MultipleResultPrimaryQueryManager<TEntity>;
  /**
   * Adds a single result query to the manager and returns it.
   * @param query Single ids query handler.
   * @param redis Redis middleware.
   * @param reverseHashKey Redis reverse hash key.
   * @param queryKeyGen Query key generator.
   * @param entityKeyGen Entity key generator.
   * @param mquery Multiple ids query handler.
   * @returns Single query result manager generated.
   */
  addSingleResultQuery<TResult extends SingleQueryResult>(
    query: TQuery<TResult>,
    redis: RedisMiddleware,
    reverseHashKey: string,
    queryKeyGen: (params: any) => string,
    entityKeyGen: (entity: TEntity) => string,
    mquery: TMQuery<TResult>,
  ): SingleResultPrimaryQueryManager<TEntity>;
}
