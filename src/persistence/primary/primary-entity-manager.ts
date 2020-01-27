import { Entity } from '../../model/entity';
import { PersistencySearchOptions } from '../options/persistency-search-options';

export interface PrimaryEntityManager<TEntity extends Entity> {
  /**
   * True to use negative entity cache.
   */
  readonly negativeCache: boolean;
  /**
   * Caches an entity found after a cache miss.
   * @param id Entity's id.
   * @param entity Entity to cache or null if no entity was found.
   * @param options Persistency options.
   */
  cacheMiss(id: number | string, entity: TEntity, options: PersistencySearchOptions): Promise<void>;
  /**
   * Entities to cache.
   *
   * If this manager has a negative cache strategy, ids and entities parameters must be sorted by id (ASC)
   * If this manager doesn't have a negative cache strategy, entities[i][model.id] === id[i] is expected to be true.
   *
   * @param ids Ids of the entities to cache.
   * @param entities Entities to cache.
   * @param options Persistency options.
   * @returns Promise of entities cached.
   */
  cacheMisses(ids: number[] | string[], entities: TEntity[], options: PersistencySearchOptions): Promise<void>;
  /**
   * Gets an entity at the cache layer by its id.
   * @param id Entity's id
   * @returns
   *
   * An entity if found.
   *
   * If the cache system is able to know that no entity has the requested id, a null value is returned.
   * If the cache system is unable to know if no entity has the requested id, undefined is returned instead.
   */
  get(id: number | string): Promise<TEntity>;
  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @param options Cache options.
   * @returns Models found.
   */
  mGet(ids: number[] | string[]): Promise<TEntity[]>;
}
