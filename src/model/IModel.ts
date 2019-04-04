import { IKeyGenParams } from './IKeyGenParams';

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
   * Key generation config.
   */
  keyGen: IKeyGenParams;
}
