import { IKeyGenParams } from './IKeyGenParams';
import { IModel } from './IModel';

export class Model implements IModel {
  /**
   * Entity key generation data.
   */
  protected _keyGenParams: IKeyGenParams;
  /**
   * Model's id.
   */
  protected _id: string;

  /**
   * Model's properties.
   */
  protected _properties: string[];

  /**
   * Constructor.
   * @param id Model's id.
   * @param properties Model's properties.
   */
  public constructor(
    id: string,
    properties: string[],
    keyGenParams: IKeyGenParams,
  ) {
    this._keyGenParams = keyGenParams;
    this._id = id;
    this._properties = properties;
  }

  public get keyGenParams(): IKeyGenParams {
    return this._keyGenParams;
  }

  public get id(): string {
    return this._id;
  }

  public get properties(): string[] {
    return this._properties;
  }
}
