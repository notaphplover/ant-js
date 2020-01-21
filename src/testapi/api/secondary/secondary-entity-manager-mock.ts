import * as _ from 'lodash';
import { Entity } from '../../../model/entity';
import { Model } from '../../../model/model';
import { SecondaryEntityManager } from '../../../persistence/secondary/secondary-entity-manager';

export class SecondaryEntityManagerMock<TEntity extends Entity> implements SecondaryEntityManager<TEntity> {
  /**
   * Model managed.
   */
  protected _model: Model<TEntity>;

  /**
   * Entities set.
   */
  protected _store: Map<number | string, TEntity>;

  /**
   * Creates a new Secondary model manager.
   * @param model Model of the manager.
   * @param store Inital entities.
   */
  public constructor(model: Model<TEntity>, store: TEntity[] = new Array()) {
    this._model = model;
    this._initializeStore(store);
  }

  /**
   * Model managed.
   */
  public get model(): Model<TEntity> {
    return this._model;
  }

  /**
   * Entities set.
   */
  public get store(): Map<number | string, TEntity> {
    return this._store;
  }

  /**
   * Detetes an entity by its id.
   * @param id Entity's id.
   * @returns Promise of entity deleted.
   */
  public delete(id: number | string): Promise<any> {
    this._store.delete(id);
    return Promise.resolve();
  }

  /**
   * Finds an entity by its id.
   * @param id entity's id.
   * @returns Promise of entity found.
   */
  public getById(id: number | string): Promise<TEntity> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  /**
   * Finds entities by its ids.
   * @param ids Entities ids.
   * @returns Promise of entities found.
   */
  public getByIds(ids: number[] | string[]): Promise<TEntity[]> {
    const entities = new Array<TEntity>();
    for (const id of ids) {
      const entity = this.store.get(id);
      if (entity) {
        entities.push(entity);
      }
    }
    return Promise.resolve(entities);
  }

  /**
   * Finds entities by its ids sorted.
   * @param ids Entities ids.
   * @returns Promise of entities found.
   */
  public getByIdsOrderedAsc(ids: number[] | string[]): Promise<TEntity[]> {
    return new Promise<TEntity[]>((resolve, reject) => {
      this.getByIds(ids)
        .then((entities) => {
          if (0 === entities.length) {
            resolve(entities);
          } else {
            if ('number' === typeof ids[0]) {
              resolve(entities.sort((a: TEntity, b: TEntity) => a[this.model.id] - b[this.model.id]));
            } else {
              if ('string' === typeof ids[0]) {
                resolve(
                  entities.sort((a: TEntity, b: TEntity) => this._compareStrings(a[this.model.id], b[this.model.id])),
                );
              } else {
                throw new Error('Expected ids as number or strings');
              }
            }
          }
        })
        .catch(reject);
    });
  }

  /**
   * Detetes entities by their ids.
   * @param ids Entities ids.
   * @returns Promise of entities deleted.
   */
  public mDelete(ids: number[] | string[]): Promise<any> {
    for (const id of ids) {
      this._store.delete(id);
    }
    return Promise.resolve();
  }

  /**
   * Compares two strings.
   * @param a First string to be compared.
   * @param b Second string to be compared.
   * @returns Comparison result.
   */
  protected _compareStrings(a: string, b: string): number {
    const chars = Math.min(a.length, b.length);
    for (let i = 0; i < chars; ++i) {
      const comp = a.charCodeAt(i) - b.charCodeAt(i);
      if (comp !== 0) {
        return comp;
      }
    }
    if (a.length === b.length) {
      return 0;
    }
    return a.length === chars ? -1 : 1;
  }

  /**
   * Initializes the store.
   * @param entities Initial entities.
   */
  private _initializeStore(entities: TEntity[]): void {
    this._store = new Map(_.map(entities, (entity) => [entity[this.model.id], entity]));
  }
}
