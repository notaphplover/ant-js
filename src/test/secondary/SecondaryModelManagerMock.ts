import { IEntity } from '../../model/IEntity';
import { IModel } from '../../model/IModel';
import { ISecondaryModelManager } from '../../persistence/secondary/ISecondaryModelManager';

export class SecondaryModelManagerMock<TModel extends IModel, TEntity extends IEntity>
  implements ISecondaryModelManager<TModel, TEntity> {

  /**
   * Model managed.
   */
  protected _model: TModel;

  /**
   * Entities set.
   */
  protected _store: TEntity[];

  /**
   * Creates a new Secondary model manager.
   * @param model Model of the manager.
   * @param store Inital entities.
   */
  public constructor(model: TModel, store: TEntity[] = new Array()) {
    this._model = model;
    this._store = store;
  }

  /**
   * Model managed.
   */
  public get model(): TModel {
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
        undefined !== entity[idField] && id === entity[idField]),
      ),
    );
  }

  /**
   * Finds entities by its ids.
   * @param ids Entities ids.
   * @returns Promise of entities found.
   */
  public getByIds(ids: Array<number|string>): Promise<TEntity[]> {
    const idField = this.model.id;
    const idSet = new Set<number|string>(ids);
    return new Promise((resolve) =>
      resolve(this.store.filter((entity) =>
        undefined !== entity[idField] && idSet.has(entity[idField])),
      ),
    );
  }
}
