import { AntQueryManager } from './ant-query-manager';
import { ApiSingleResultQueryManager } from './api-single-result-query-manager';
import { Entity } from '../../model/entity';
import { QueryManager } from '../../persistence/primary/query/query-manager';

export class AntSingleResultQueryManager<TEntity extends Entity> extends AntQueryManager<TEntity, TEntity>
  implements ApiSingleResultQueryManager<TEntity> {
  /**
   * Creates a new Ant single result query manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: QueryManager<TEntity, TEntity>) {
    super(queryManager);
  }
}
