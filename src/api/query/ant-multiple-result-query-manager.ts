import { IEntity } from '../../model/IEntity';
import { QueryManager } from '../../persistence/primary/query/query-manager';
import { AntQueryManager } from './ant-query-manager';
import { ApiMultipleResultQueryManager } from './api-multiple-result-query-manager';

export class AntMultipleResultQueryManager<TEntity extends IEntity> extends AntQueryManager<TEntity, TEntity[]>
  implements ApiMultipleResultQueryManager<TEntity> {
  /**
   * Creates a new Ant single result query manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: QueryManager<TEntity, TEntity[]>) {
    super(queryManager);
  }
}
