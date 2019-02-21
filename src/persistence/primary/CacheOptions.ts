export enum CacheOptions {
  /**
   * The entity is not cached.
   */
  NoCache = 0,
  /**
   * The entity is cached if it's not cached.
   */
  CacheIfNotExist = 1,
  /**
   * The entity is cached and overwrites the previous cache value.
   */
  CacheAndOverwrite = 2,
}
