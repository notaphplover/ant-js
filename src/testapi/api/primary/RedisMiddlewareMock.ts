import { IRedisMiddleware } from '../../../persistence/primary/IRedisMiddleware';

export class RedisMiddlewareMock implements IRedisMiddleware {

  /**
   * @inheritdoc
   */
  public eval(): Promise<any> {
    return new Promise((resolve) => { resolve(); });
  }
  /**
   * @inheritdoc
   */
  public evalsha(): Promise<any> {
    return new Promise((resolve) => { resolve(null); });
  }
  /**
   * @inheritdoc
   */
  public get(): Promise<string | null> {
    return new Promise((resolve) => { resolve(null); });
  }
  /**
   * @inheritdoc
   */
  public mget(...keys: string[]): Promise<any[]> {
    return new Promise((resolve) => {
      const results = new Array(keys.length);
      for (let i = 0; i < results.length; ++i) {
        results[i] = null;
      }
      resolve(results);
    });
  }
  /**
   * @inheritdoc
   */
  public mset(): Promise<any> {
    return new Promise((resolve) => { resolve(null); });
  }
  /**
   * @inheritdoc
   */
  public set(): Promise<string> {
    return new Promise((resolve) => { resolve(''); });
  }
}
