import { IEntity } from '../../model/IEntity';
import { IQueryManager } from '../../persistence/primary/query/IQueryManager';
import { AntQueryManager } from './AntQueryManager';
import { IAntMultipleResultQueryManager } from './IAntMultipleResultQueryManager';

export class AntMultipleResultQueryManager<TEntity extends IEntity>
  extends AntQueryManager<TEntity, TEntity[]> implements IAntMultipleResultQueryManager<TEntity> {

  /**
   * Creates a new Ant single result query manager.
   * @param queryManager Inner query manager.
   */
  public constructor(queryManager: IQueryManager<TEntity, TEntity[]>) {
    super(queryManager);
  }
}
