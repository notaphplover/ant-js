export interface IQueriesManagerGeneratorOptions {
  /**
   * Properties to be handled by a query manager.
   */
  properties: string[];
  /**
   * Reverse hash key to be used by the queries manager.
   */
  reverseHashKey?: string;
}
