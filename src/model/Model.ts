import { IModel } from './IModel';

export class Model implements IModel {
  /**
   * Model's id.
   */
  protected _id: string;

  /**
   * Constructor.
   * @param id Model's id.
   */
  public constructor(id: string) {
    this._id = id;
  }

  public get id(): string {
    return this._id;
  }
}
