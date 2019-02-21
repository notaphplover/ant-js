/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface IModel {
  [key: string]: any;
  /**
   * Model's id field.
   */
  id: string;
  /**
   * Model's properties
   */
  properties: Iterable<string>;
}
