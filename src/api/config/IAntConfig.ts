import { IAntModelConfig } from './IAntModelConfig';

export interface IAntConfig<TConfig extends IAntModelConfig> {
  /**
   * Default managers config.
   */
  default: TConfig;
}
