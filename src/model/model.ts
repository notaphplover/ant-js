import { KeyGenParams } from './key-gen-params';

/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface Model {
  /**
   * Model's id field.
   */
  id: string;
  /**
   * Key generation config.
   */
  keyGen: KeyGenParams;
}
