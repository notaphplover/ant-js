import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ISecondaryEntityManager } from '../../persistence/secondary/ISecondaryEntityManager';

export class SecondaryEntityManagerMock<TEntity extends IEntity>
  implements ISecondaryEntityManager<TEntity> {

  /**
   * Model managed.
   */
  protected _model: IModel;

  /**
   * Entities set.
   */
  protected _store: TEntity[];

  /**
   * Creates a new Secondary model manager.
   * @param model Model of the manager.
   * @param store Inital entities.
   */
  public constructor(model: IModel, store: TEntity[] = new Array()) {
    this._model = model;
    this._store = store;
  }

  /**
   * Model managed.
   */
  public get model(): IModel {
    return this._model;
  }

  /**
   * Entities set.
   */
  public get store(): TEntity[] {
    return this._store;
  }

  /**
   * Finds an entity by its id.
   * @param id entity's id.
   * @returns Promise of entity found.
   */
  public getById(id: number|string): Promise<TEntity> {
    const idField = this.model.id;
    return new Promise((resolve) =>
      resolve(this.store.find((entity) =>
        undefined !== entity[idField] && id === entity[idField],
      ) || null),
    );
  }

  /**
   * Finds entities by its ids.
   * @param ids Entities ids.
   * @returns Promise of entities found.
   */
  public getByIds(ids: number[]| string[]): Promise<TEntity[]> {
    const idField = this.model.id;
    const idSet = new Set<number|string>(ids);
    return new Promise((resolve) =>
      resolve(this.store.filter((entity) =>
        undefined !== entity[idField] && idSet.has(entity[idField])),
      ),
    );
  }
}