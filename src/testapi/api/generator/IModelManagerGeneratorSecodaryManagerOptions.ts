import { IEntity } from '../../../model/IEntity';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';

export interface IModelManagerGeneratorSecodaryManagerOptions<
  TSecondaryManager extends ISecondaryEntityManager<IEntity>
> {
  /**
   * Secondary entity manager to be used.
   */
  manager?: TSecondaryManager;
}
