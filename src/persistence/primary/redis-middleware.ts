export interface RedisMiddleware {
  /**
   * Evaluates an sript.
   * @param args Script arguments.
   * @param Script result.
   */
  eval(...args: any[]): Promise<any>;
  /**
   * Evaluates an sript.
   * @param args Script arguments.
   * @param Script result.
   */
  evalsha(...args: any[]): Promise<any>;
  /**
   * Gets the value of a cache entry.
   * @param key Key of the entry to get.
   * @returns Entry
   */
  get(key: string): Promise<string | null>;
  /**
   * Serach for cache entries.
   * @param keys Cache entry keys.
   * @returns Cache entries found.
   */
  mget(...keys: string[]): Promise<any[]>;
  /**
   * Sets a cache entry.
   * @param key Entry jey.
   * @param value Entry value.
   * @param expiryMode Entry expiry mode.
   * @param time Entry expiry time.
   * @param setMode Entry set model.
   */
  set(
    key: string,
    value: any,
    expiryMode?: string | any[],
    time?: number | string,
    setMode?: number | string,
  ): Promise<string>;
  /**
   * Sets multiple cache entries.
   * @param args Cache keys and values to set.
   * @returns Script returning value.
   */
  mset(...args: any[]): Promise<any>;
}
