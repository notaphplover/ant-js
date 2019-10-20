import { Entity } from '../../../model/entity';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';

export interface IModelManagerGeneratorSecodaryManagerOptions<
  TSecondaryManager extends ISecondaryEntityManager<Entity>
> {
  /**
   * Secondary entity manager to be used.
   */
  manager?: TSecondaryManager;
}
