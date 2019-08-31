import { IEntity } from '../../../model/IEntity';
import { IModel } from '../../../model/IModel';
import { IModelManager } from '../../../persistence/primary/IModelManager';
import { IRedisMiddleware } from '../../../persistence/primary/IRedisMiddleware';
import { IMultipleResultQueryManager } from '../../../persistence/primary/query/IMultipleResultQueryManager';
import { IPrimaryQueryManager } from '../../../persistence/primary/query/IPrimaryQueryManager';
import { ISingleResultQueryManager } from '../../../persistence/primary/query/ISingleResultQueryManager';
import { MultipleResultQueryManager } from '../../../persistence/primary/query/MultipleResultQueryManager';
import { SingleResultQueryManager } from '../../../persistence/primary/query/SingleResultQueryManager';
import { ISecondaryEntityManager } from '../../../persistence/secondary/ISecondaryEntityManager';
import { IModelManagerGeneratorOptions } from './IModelManagerGeneratorOptions';

export abstract class ModelManagerGenerator<
  TOptions extends IModelManagerGeneratorOptions<IModel>,
  TModelManager extends IModelManager<IEntity>,
  TSecondaryManager extends ISecondaryEntityManager<IEntity>
> {
  /**
   * Default redis middleware.
   */
  protected _defaultRedisMiddleware: IRedisMiddleware;

  /**
   * Creates a model manager generator.
   * @param defaultRedisMiddleware Default redis middleware.
   */
  public constructor(defaultRedisMiddleware: IRedisMiddleware) {
    this._defaultRedisMiddleware = defaultRedisMiddleware;
  }

  /**
   * Generates a model manager with query managers attached.
   * @param options Generation options.
   */
  public generateModelManager<TEntity extends IEntity>(options: TOptions): [
    TModelManager,
    Map<string, ISingleResultQueryManager<TEntity>>,
    Map<string, IMultipleResultQueryManager<TEntity>>,
  ] {
    if (!options.redisOptions) {
      options.redisOptions = {};
    }
    const redisOptions = options.redisOptions;
    if (!redisOptions.redis) {
      redisOptions.redis = this._defaultRedisMiddleware;
    }

    const secondaryManager = this._generateSecondaryManager(options);
    const modelManager = this._generateModelManager(options, secondaryManager);

    const singleResultQueryManagers: Map<string, ISingleResultQueryManager<TEntity>>
      = redisOptions.singleResultQueryManagersOptions ?
        this._generateSingleResultQueryManagers(
          options,
          secondaryManager,
          modelManager,
        ) : new Map();

    this._attachQueryManagers(modelManager, singleResultQueryManagers.values());

    const multipleResultQueryManagers: Map<string, IMultipleResultQueryManager<TEntity>>
      = redisOptions.multipleResultQueryManagersOptions ?
        this._generateMultipleResultQueryManagers(
          options,
          secondaryManager,
          modelManager,
        ) : new Map();

    this._attachQueryManagers(modelManager, multipleResultQueryManagers.values());

    return [
      modelManager,
      singleResultQueryManagers,
      multipleResultQueryManagers,
    ];
  }

  /**
   * Attaches queries to a model manager.
   * @param modelManager Model manager to attach queries.
   * @param queries Queries to be attached.
   */
  protected _attachQueryManagers(
    modelManager: IModelManager<IEntity>,
    queries: Iterable<IPrimaryQueryManager<IEntity>>,
  ): void {
    for (const query of queries) {
      modelManager.addQuery(query);
    }
  }

  /**
   * Generates a raw model manager.
   * @param options Generation options.
   * @param secondaryManager seconday manager to be user by the model manager.
   */
  protected abstract _generateModelManager(
    options: TOptions,
    secondaryManager: TSecondaryManager,
  ): TModelManager;

  /**
   * Generates a single result query manager.
   * @param options Generation options.
   * @returns Map of properties to query managers.
   */
  protected _generateMultipleResultQueryManagers<
    TEntity extends IEntity,
  >(
    options: TOptions,
    secondaryManager: TSecondaryManager,
    modelManager: TModelManager,
  ): Map<string, IMultipleResultQueryManager<TEntity>> {
    const queryManagersMap = new Map<string, IMultipleResultQueryManager<TEntity>>();
    const mrqmOptions = options.redisOptions.multipleResultQueryManagersOptions;
    if (!mrqmOptions) {
      return queryManagersMap;
    }
    if (!mrqmOptions.reverseHashKey) {
      mrqmOptions.reverseHashKey = this._generateRandomKey();
    }

    for (const property of mrqmOptions.properties) {
      const queryKeyGen = (param: any): string => {
        return mrqmOptions.reverseHashKey + param[property];
      };
      const queryManager = new MultipleResultQueryManager(
        (params: any) =>
          this._searchEntitiesByProperty(secondaryManager, property, params[property])
            .then((entities) => entities.map((entity) => entity[options.model.id])),
        modelManager,
        options.redisOptions.redis,
        mrqmOptions.reverseHashKey,
        queryKeyGen,
        queryKeyGen,
      );

      queryManagersMap.set(property, queryManager);
    }

    return queryManagersMap;
  }

  /**
   * Generates a random key.
   * @returns Random key generated.
   */
  protected _generateRandomKey(): string {
    const length = 32;
    const textGenerator = (length: number) => {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < length; ++i) {
         result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };
    return textGenerator(length);
  }

  /**
   * Generates a secondary model manager.
   * @param options Generation options.
   * @returns secondary model manager generated.
   */
  protected abstract _generateSecondaryManager(options: TOptions): TSecondaryManager;

  /**
   * Generates a single result query manager.
   * @param options Generation options.
   * @returns Map of properties to query managers.
   */
  protected _generateSingleResultQueryManagers<
    TEntity extends IEntity,
  >(
    options: TOptions,
    secondaryManager: TSecondaryManager,
    modelManager: TModelManager,
  ): Map<string, ISingleResultQueryManager<TEntity>> {
    const queryManagersMap = new Map<string, ISingleResultQueryManager<TEntity>>();
    const srqmOptions = options.redisOptions.singleResultQueryManagersOptions;
    if (!srqmOptions) {
      return queryManagersMap;
    }
    if (!srqmOptions.reverseHashKey) {
      srqmOptions.reverseHashKey = this._generateRandomKey();
    }

    for (const property of srqmOptions.properties) {
      const queryKeyGen = (param: any): string => {
        return srqmOptions.reverseHashKey + param[property];
      };
      const queryManager = new SingleResultQueryManager(
        (params: any) =>
          this._searchEntityByProperty(secondaryManager, property, params[property])
          .then((entity) => {
            if (null == entity) {
              return null;
            }
            return entity[options.model.id];
          }),
        modelManager,
        options.redisOptions.redis,
        srqmOptions.reverseHashKey,
        queryKeyGen,
        queryKeyGen,
      );

      queryManagersMap.set(property, queryManager);
    }

    return queryManagersMap;
  }

  /**
   * Search entities by a property value.
   * @param secondaryManager Secondary model manager to use to perform the search.
   * @param property Model's property to use as discriminator.
   * @param value Value to match.
   * @returns Entities found.
   */
  protected abstract _searchEntitiesByProperty<TEntity extends IEntity>(
    secondaryManager: TSecondaryManager,
    property: string,
    value: any,
  ): Promise<TEntity[]>;

  /**
   * Search an entity by a property value.
   * @param secondaryManager Secondary model manager to use to perform the search.
   * @param property Model's property to use as discriminator.
   * @param value Value to match.
   * @returns Entity found.
   */
  protected abstract _searchEntityByProperty<TEntity extends IEntity>(
    secondaryManager: TSecondaryManager,
    property: string,
    value: any,
  ): Promise<TEntity>;
}
