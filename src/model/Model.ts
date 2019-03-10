import { IEntityKeyGenerationData } from './IEntityKeyGenerationData';
import { IModel } from './IModel';

export class Model implements IModel {
  /**
   * Entity key generation data.
   */
  protected _entityKeyGenerationData: IEntityKeyGenerationData;
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
    entityKeyGenerationData: IEntityKeyGenerationData,
  ) {
    this._entityKeyGenerationData = entityKeyGenerationData;
    this._id = id;
    this._properties = properties;
  }

  public get entityKeyGenerationData(): IEntityKeyGenerationData {
    return this._entityKeyGenerationData;
  }

  public get id(): string {
    return this._id;
  }

  public get properties(): string[] {
    return this._properties;
  }
}
