import { BaseModel } from './base-model';
import { Entity } from './entity';

/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface Model<TEntity extends Entity> extends BaseModel {
  /**
   * Transforms an entity into a primary object.
   * @param entity Entity to transform
   */
  entityToPrimary(entity: TEntity): any;
  /**
   * Transforms a set of entities into a set of primary objects.
   * @param entities Entities to transform
   */
  mEntityToPrimary(entities: TEntity[]): any[];
  /**
   * Transform a set of primary objects into a set of entities
   * @param primaries Primaries to transform
   */
  mPrimaryToEntity(primaries: any[]): TEntity[];
  /**
   * Transform a primary object into an entity.
   * @param primary Primary object to transform.
   */
  primaryToEntity(primary: any): TEntity;
}
