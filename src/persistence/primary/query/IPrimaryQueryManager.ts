import { IEntity } from '../../../model/IEntity';
import { ICacheOptions } from '../options/ICacheOptions';

export interface IBasePrimaryQueryManager<
  TEntity extends IEntity,
  TResult extends TEntity | TEntity[],
> {
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
  /**
   * Gets a query result.
   * @param params query params.
   * @returns query results.
   */
  get(
    params: any,
    cacheOptions?: ICacheOptions,
  ): Promise<TResult>;
  /**
   * Gets the result of multiple queries.
   * @param paramsArray Queries parameters.
   * @param cacheOptions Cache options.
   * @returns Queries results.
   */
  mGet(
    paramsArray: any[],
    cacheOptions?: ICacheOptions,
  ): Promise<TEntity[]>;
}

export interface IPrimaryQueryManager<TEntity extends IEntity>
  extends IBasePrimaryQueryManager<TEntity, TEntity | TEntity[]> {}
