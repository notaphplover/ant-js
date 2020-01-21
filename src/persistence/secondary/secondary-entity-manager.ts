import { Entity } from '../../model/entity';
import { Model } from '../../model/model';

export interface SecondaryEntityManager<TEntity extends Entity> {
  /**
   * Model of the manager.
   */
  readonly model: Model<TEntity>;

  /**
   * Detetes an entity by its id.
   * @param id Entity's id.
   * @returns Promise of entity deleted.
   */
  delete(id: number | string): Promise<any>;

  /**
   * Gets an entity by its id.
   * @param id: Entity's id.
   * @returns Entity found.
   */
  getById(id: number | string): Promise<TEntity>;

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIds(ids: number[] | string[]): Promise<TEntity[]>;

  /**
   * Gets a collection of models by its ids ordered by id asc.
   * @param ids Model ids.
   * @returns Models found.
   */
  getByIdsOrderedAsc(ids: number[] | string[]): Promise<TEntity[]>;

  /**
   * Deletes entities from their ids.
   * @param ids Ids of the entities to delete.
   * @returns Promise of entities deleted.
   */
  mDelete(ids: string[] | number[]): Promise<any>;
}
