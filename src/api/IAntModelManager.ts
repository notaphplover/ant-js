import { IEntity } from '../model/IEntity';
import { IBaseModelManager } from '../persistence/primary/IModelManager';
import { IBasePrimaryQueryManager, IPrimaryQueryManager } from '../persistence/primary/query/IPrimaryQueryManager';
import { MultipleResultQueryManager } from '../persistence/primary/query/MultipleResultQueryManager';
import { QueryResult } from '../persistence/primary/query/PrimaryQueryManager';
import { SingleResultQueryManager } from '../persistence/primary/query/SingleResultQueryManager';
import { IAntModelConfig } from './config/IAntModelConfig';
import { IAntQueryConfig } from './IAntQueryConfig';

export type TQueryManager<TEntity, TQueryResult> =
  TQueryResult extends any[]
    ? MultipleResultQueryManager<TEntity>
    : SingleResultQueryManager<TEntity>;

export interface IAntModelManager<TEntity extends IEntity, TConfig extends IAntModelConfig>
  extends IBaseModelManager<TEntity> {

  /**
   * Gets the AntJS model config.
   * @returns AntJS model config.
   */
  config(): TConfig;
  /**
   * Sets the AntJS model onfig.
   * @param config AntJS model config.
   */
  config(config: TConfig): this;
  /**
   * Gets a query from its alias.
   * @param alias Alias of the query.
   * @returns Query found.
   */
  query<TResult extends TEntity | TEntity[]>(
    alias: string,
  ): IBasePrimaryQueryManager<TEntity, TResult>;
  /**
   * Adds a query to the manager.
   * @param query Query to add.
   * @param aliasOrNothing Alias of the query.
   * @returns This instance.
   */
  query<TQueryResult extends QueryResult>(
    queryConfig: IAntQueryConfig<TEntity, TQueryResult>,
    aliasOrNothing?: string,
  ): TQueryManager<TEntity, TQueryResult>;
}
