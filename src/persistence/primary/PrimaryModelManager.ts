import Redis from 'ioredis';
import { IModel } from '../../model/IModel';
import { ISecondaryModelManager } from '../secondary/ISecondaryModelManager';
import { CacheOptions } from './CacheOptions';
import { EntitySearchOptions } from './EntitySearchOptions';
import { IEntitySearchOptions } from './IEntitySearchOptions';
import { IPrimaryModelManager } from './IPrimaryModelManager';

export abstract class PrimaryModelManager<TModel extends IModel> implements IPrimaryModelManager<TModel> {
  /**
   * Manager's model.
   */
  protected _model: TModel;
  /**
   * Redis connection.
   */
  protected _redis: Redis.Redis;
  /**
   * Secondary model manager of the model.
   */
  protected _successor: ISecondaryModelManager<TModel>;

  /**
   * Creates a new primary model manager.
   * @param redis Redis connection
   */
  public constructor(
    model: TModel,
    redis: Redis.Redis,
    successor: ISecondaryModelManager<TModel>,
  ) {
    this._model = model;
    this._redis = redis;
    this._successor = successor;
  }

  /**
   * Caches an entity.
   * @param entity entity to cache.
   * @param searchOptions Search options.
   * @returns Promise of redis operation ended
   */
  public cacheEntity(entity: TModel, searchOptions: IEntitySearchOptions) {
    if (CacheOptions.NoCache === searchOptions.cacheOptions) {
      return new Promise((resolve) => resolve());
    }
    const key = this.getKey(entity[this._model.id]);
    switch (searchOptions.cacheOptions) {
      case CacheOptions.CacheIfNotExist:
        return this._redis.setnx(key, JSON.stringify(entity));
      case CacheOptions.CacheAndOverwrite:
        return this._redis.set(key, JSON.stringify(entity));
      default:
        throw new Error('Unexpected cache options.');
    }
  }

  /**
   * Gets a model by its id.
   * @param id: Model's id.
   * @returns Model found.
   */
  public getById(
    id: number|string,
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
  ): Promise<TModel> {
    return this.innerGetById(id, searchOptions);
  }

  /**
   * Gets a collection of models by its ids.
   * @param ids Model ids.
   * @returns Models found.
   */
  public getByIds(
    ids: Iterable<number|string>,
    searchOptions: IEntitySearchOptions,
  ): Promise<Iterable<TModel>> {
    return this.innerGetByIds(ids, searchOptions);
  }

  /**
   * Gets the key of an entity.
   * @param id entity's id.
   */
  protected abstract getKey(id: number|string): string;

  /**
   * Gets an entity by its id.
   * @param id Entity's id.
   * @param searchOptions Search options.
   */
  protected async innerGetById(
    id: number|string,
    searchOptions: IEntitySearchOptions = new EntitySearchOptions(),
  ): Promise<TModel> {
    const cachedEntity = await this._redis.get(this.getKey(id));
    if (cachedEntity) {
      return JSON.parse(cachedEntity);
    }
    if (!this._successor) {
      return undefined;
    }
    return this._successor.getById(id).then((entity) => {
      this.cacheEntity(entity, searchOptions);
      return entity;
    });
  }

  protected async innerGetByIds(
    ids: Iterable<number|string>,
    searchOptions: IEntitySearchOptions,
  ): Promise<Iterable<TModel>> {
    return new Promise<Iterable<TModel>>((resolve) => resolve(null));
  }
}
