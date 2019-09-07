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
import { IModelManagerGeneratorRedisOptions } from './IModelManagerGeneratorRedisOptions';
import { IModelManagerGeneratorSecodaryManagerOptions } from './IModelManagerGeneratorSecodaryManagerOptions';
import { IQueriesManagerGeneratorOptions } from './IQueriesManagerGeneratorOptions';

export abstract class ModelManagerGenerator<
  TOptions extends IModelManagerGeneratorOptions<
    IModel,
    IModelManagerGeneratorRedisOptions,
    IModelManagerGeneratorSecodaryManagerOptions<TSecondaryManager>
  >,
  TModelManager extends IModelManager<IEntity>,
  TSecondaryManager extends ISecondaryEntityManager<IEntity>,
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
  public generateModelManager(options: TOptions): [
    TModelManager,
    TSecondaryManager,
    Map<string, ISingleResultQueryManager<IEntity>>,
    Map<string, IMultipleResultQueryManager<IEntity>>,
  ] {
    if (!options.redisOptions) {
      options.redisOptions = {};
    }
    const redisOptions = options.redisOptions;
    if (!redisOptions.redis) {
      redisOptions.redis = this._defaultRedisMiddleware;
    }

    if (!options.secondaryOptions) {
      options.secondaryOptions = {};
    }

    const secondaryManagerOptions = options.secondaryOptions;

    if (!secondaryManagerOptions.manager) {
      secondaryManagerOptions.manager = this._generateDefaultSecondaryManager(options);
    }

    const secondaryManager = secondaryManagerOptions.manager;
    const modelManager = this._generateModelManager(options, secondaryManager);

    const singleResultQueryManagers: Map<string, ISingleResultQueryManager<IEntity>>
      = this._generateSingleResultQueryManagers(
          options,
          secondaryManager,
          modelManager,
        );

    this._attachQueryManagers(modelManager, singleResultQueryManagers.values());

    const multipleResultQueryManagers: Map<string, IMultipleResultQueryManager<IEntity>>
      = this._generateMultipleResultQueryManagers(
          options,
          secondaryManager,
          modelManager,
        );

    this._attachQueryManagers(modelManager, multipleResultQueryManagers.values());

    return [
      modelManager,
      secondaryManager,
      singleResultQueryManagers,
      multipleResultQueryManagers,
    ];
  }

  /**
   * Search for entities in a set of query managers by property.
   * @param entities Entities to search for.
   * @param srQueryManagers Map of single result queru managers.
   * @param mrQueryManagers Map of multiple result query managers.
   * @returns Promises of results obtained from the query managers.
   */
  public searchEntititiesInQueries(
    entities: IEntity[],
    srQueryManagers: Map<string, ISingleResultQueryManager<IEntity>>,
    mrQueryManagers: Map<string, IMultipleResultQueryManager<IEntity>>,
  ): [
    Map<[IEntity, string], Promise<IEntity>>,
    Map<[IEntity, string], Promise<IEntity[]>>,
  ] {
    const srqmResults: Map<[IEntity, string], Promise<IEntity>> = new Map();
    const mrqmResults: Map<[IEntity, string], Promise<IEntity[]>> = new Map();

    for (const [property, manager] of srQueryManagers) {
      for (const entity of entities) {
        srqmResults.set([entity, property], manager.get(entity));
      }
    }

    for (const [property, manager] of mrQueryManagers) {
      for (const entity of entities) {
        mrqmResults.set([entity, property], manager.get(entity));
      }
    }

    return [srqmResults, mrqmResults];
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
   * Builds a query keygen for a certain property.
   * @param queryPrefix Query prefix
   * @param property Query property.
   * @returns Key generator built.
   */
  protected _buildQueryKeyGen(queryPrefix: string, property: string): (param: any) => string {
    return (param: any): string => {
      return queryPrefix + property + '/' + param[property];
    };
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
    this._processQueryManagersGenerationOptions(mrqmOptions);

    for (const property of mrqmOptions.properties) {
      const queryKeyGen = this._buildQueryKeyGen(mrqmOptions.queryPrefix, property);
      const queryManager = new MultipleResultQueryManager(
        (params: any) =>
          this._searchEntitiesByProperty(secondaryManager, property, params[property])
            .then((entities) => entities.map((entity) => entity[options.model.id])),
        modelManager,
        options.redisOptions.redis,
        mrqmOptions.reverseHashKey + property,
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
  protected abstract _generateDefaultSecondaryManager(options: TOptions): TSecondaryManager;

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
    this._processQueryManagersGenerationOptions(srqmOptions);

    for (const property of srqmOptions.properties) {
      const queryKeyGen = this._buildQueryKeyGen(srqmOptions.queryPrefix, property);
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
        srqmOptions.reverseHashKey + property,
        queryKeyGen,
        queryKeyGen,
      );

      queryManagersMap.set(property, queryManager);
    }

    return queryManagersMap;
  }

  /**
   * Process a query managers generation options.
   */
  protected _processQueryManagersGenerationOptions(
    options: IQueriesManagerGeneratorOptions,
  ): void {
    if (!options.queryPrefix) {
      options.queryPrefix = this._generateRandomKey();
    }
    if (!options.reverseHashKey) {
      options.reverseHashKey = this._generateRandomKey();
    }
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
