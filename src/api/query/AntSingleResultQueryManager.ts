import { IEntity } from '../../model/IEntity';
import { IQueryManager } from '../../persistence/primary/query/IQueryManager';
import { AntQueryManager } from './ant-query-manager';
import { IAntSingleResultQueryManager } from './IAntSingleResultQueryManager';

export class AntSingleResultQueryManager<TEntity extends IEntity> extends AntQueryManager<TEntity, TEntity>
  implements IAntSingleResultQueryManager<TEntity> {
  /**
   * Creates a new Ant single result query manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: IQueryManager<TEntity, TEntity>) {
    super(queryManager);
  }
}
