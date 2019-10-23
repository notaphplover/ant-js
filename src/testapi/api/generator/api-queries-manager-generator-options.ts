export interface ApiQueriesManagerGeneratorOptions {
  /**
   * Properties to be handled by a query manager.
   */
  properties: string[];
  /**
   * Query prefix used to store queries.
   */
  queryPrefix?: string;
  /**
   * Reverse hash key to be used by the queries manager.
   */
  reverseHashKey?: string;
}
