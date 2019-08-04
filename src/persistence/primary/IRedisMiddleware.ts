export interface IRedisMiddleware {
  eval(...args: any[]): Promise<any>;

  evalsha(...args: any[]): Promise<any>;

  get(key: string): Promise<string | null>;

  mget(...keys: string[]): Promise<any[]>;

  set(
    key: string,
    value: any,
    expiryMode?: string | any[],
    time?: number | string,
    setMode?: number | string,
  ): Promise<string>;

  mset(...args: any[]): Promise<any>;
}
