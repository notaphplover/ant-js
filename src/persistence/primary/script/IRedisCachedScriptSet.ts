export interface IRedisCachedScriptSet<TParams> {
  /**
   * Evaluates a script based on a generation params.
   * @param gArgs Generation args.
   * @param eArgsGen Script evaluation params.
   * @returns Promise of script evaluated.
   */
  eval(gArgs: TParams, eArgsGen: (scriptArg: string) => any[]): Promise<any>;
}
