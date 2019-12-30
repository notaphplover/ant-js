import { KeyGenParams } from './key-gen-params';

export interface BaseModel {
  /**
   * Model's id field.
   */
  readonly id: string;
  /**
   * Key generation config.
   */
  readonly keyGen: KeyGenParams;
}
