import * as IORedis from 'ioredis';
import { IEntity } from '../../model/IEntity';
import { IPrimaryModelManager } from '../../persistence/primary/IPrimaryModelManager';
import { MultipleResultQueryManager } from '../../persistence/primary/MultipleResultQueryManager';
import { SecondaryModelManagerMock } from '../secondary/SecondaryModelManagerMock';

export type NamedEntity = {id: number, name: string } & IEntity;

export class NamesStartingByLetter extends MultipleResultQueryManager<NamedEntity> {
  /**
   * Query prefix.
   */
  protected _prefix: string;

  /**
   * Creates a new NamesStartingByLetter.
   * @param primaryModelManager Primary model manager.
   * @param redis Redis connection.
   * @param reverseHashKey Reverse hash key.
   * @param prefix Query prefix.
   */
  public constructor(
    primaryModelManager: IPrimaryModelManager<NamedEntity>,
    secondaryModelManagerMock: SecondaryModelManagerMock<NamedEntity>,
    redis: IORedis.Redis,
    reverseHashKey: string,
    prefix: string,
  ) {
    super(
      (params: any) =>
        new Promise((resolve) => resolve(
          secondaryModelManagerMock.store
            .filter(
              (entity) => entity.name.startsWith(params.name[0]),
            ).map((entity) => entity.id),
          ),
        ),
      primaryModelManager,
      redis,
      reverseHashKey,
    );
    this._prefix = prefix;
  }

  /**
   * Creates a query key for the parameters provided.
   * @param params query parameters.
   */
  protected _key(params: any): string {
    if (params.name && (params.name as string).length) {
      return this._prefix + (params.name as string)[0];
    } else {
      throw new Error('Invalid params');
    }
  }
}
