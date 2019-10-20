import { IEntity } from '../../model/IEntity';
import { QueryManager } from '../../persistence/primary/query/query-manager';
import { AntQueryManager } from './ant-query-manager';
import { ApiSingleResultQueryManager } from './api-single-result-query-manager';

export class AntSingleResultQueryManager<TEntity extends IEntity> extends AntQueryManager<TEntity, TEntity>
  implements ApiSingleResultQueryManager<TEntity> {
  /**
   * Creates a new Ant single result query manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: QueryManager<TEntity, TEntity>) {
    super(queryManager);
  }
}
