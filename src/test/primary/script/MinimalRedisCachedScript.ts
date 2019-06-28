import { RedisCachedScript } from '../../../persistence/primary/script/RedisCachedScript';

export class MinimalRedisCachedScript extends RedisCachedScript {
  /**
   * Returns the SHA1 hash of the lua script.
   */
  public get sha(): string {
    return this._sha;
  }
}
