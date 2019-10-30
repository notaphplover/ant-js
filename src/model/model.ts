import { BaseModel } from './base-model';
import { Entity } from './entity';

/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface Model<TEntity extends Entity> extends BaseModel {
  /**
   * Entity to primary algorithm
   */
  entityToPrimary: (entity: TEntity) => any;
  /**
   * Primary to entity algorithm.
   */
  primaryToEntity: (primary: any) => TEntity;
}
