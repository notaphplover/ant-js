import { ApiModelConfig } from './api-model-config';

export interface ApiGeneralConfig<TConfig extends ApiModelConfig> {
  /**
   * Default managers config.
   */
  readonly default: TConfig;
}
