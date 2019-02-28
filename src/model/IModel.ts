import { IEntityKeyGenerationData } from './IEntityKeyGenerationData';

/**
 * Represents a model.
 * Models are the minimal unit of data.
 */
export interface IModel {
  /**
   * Entity key generation data.
   */
  entityKeyGenerationData: IEntityKeyGenerationData;
  /**
   * Model's id field.
   */
  id: string;
  /**
   * Model's properties
   */
  properties: string[];
}
