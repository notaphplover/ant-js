export abstract class Model {
  /**
   * Model's id.
   */
  protected _id: string;

  /**
   * Model's properties.
   */
  protected _properties: Iterable<string>;

  /**
   * Constructor.
   * @param id Model's id.
   * @param properties Model's properties.
   */
  public constructor(id: string, properties: Iterable<string>) {
    this._id = id;
    this._properties = properties;
  }

  public get id(): string {
    return this._id;
  }

  public get properties(): Iterable<string> {
    return this._properties;
  }
}
