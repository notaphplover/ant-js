import { KeyGenParams } from './key-gen-params';
import { Model } from './model';

export class AntModel implements Model {
  /**
   * Model's id.
   */
  protected _id: string;

  /**
   * Key generation config
   */
  protected _keyGen: KeyGenParams;

  /**
   * Constructor.
   * @param id Model's id.
   * @param keyGen Key generation config.
   */
  public constructor(id: string, keyGen: KeyGenParams) {
    this._id = id;
    this._keyGen = keyGen;
  }

  /**
   * Model's id.
   * @returns Model's id.
   */
  public get id(): string {
    return this._id;
  }
  /**
   * Key generation config.
   * @returns Key generation config.
   */
  public get keyGen(): KeyGenParams {
    return this._keyGen;
  }
}
