/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface IModel {
  /**
   * Model's id field.
   */
  id: string;
  /**
   * Model's properties
   */
  properties: Iterable<string>;
}
