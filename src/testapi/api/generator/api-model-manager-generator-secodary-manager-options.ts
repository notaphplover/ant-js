import { Entity } from '../../../model/entity';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';

export interface ApiModelManagerGeneratorSecodaryManagerOptions<
  TSecondaryManager extends SecondaryEntityManager<Entity>
> {
  /**
   * Secondary entity manager to be used.
   */
  manager?: TSecondaryManager;
}
