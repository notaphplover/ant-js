import { IKeyGenParams } from './IKeyGenParams';

/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface IModel {
  /**
   * Entity key generation data.
   */
  keyGenParams: IKeyGenParams;
  /**
   * Model's id field.
   */
  id: string;
  /**
   * Model's properties
   */
  properties: string[];
}
