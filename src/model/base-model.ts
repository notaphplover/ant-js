import { KeyGenParams } from './key-gen-params';

export interface BaseModel {
  /**
   * Model's id field.
   */
  id: string;
  /**
   * Key generation config.
   */
  keyGen: KeyGenParams;
}
